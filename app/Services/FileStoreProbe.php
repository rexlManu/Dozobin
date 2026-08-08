<?php

namespace App\Services;

use App\Data\RequirementCheck;
use Illuminate\Support\Str;
use Throwable;

final class FileStoreProbe
{
    public function __construct(private readonly FileStore $files) {}

    public function run(): RequirementCheck
    {
        $path = '.dozobin-probes/'.Str::uuid()->toString();
        $contents = Str::random(48);
        $written = false;

        try {
            $this->files->put($path, $contents);
            $written = true;

            if (! hash_equals($contents, $this->files->get($path))) {
                return $this->failed();
            }

            $this->files->delete($path);
            $written = false;

            return new RequirementCheck(
                'File Store',
                true,
                "The {$this->files->diskName()} disk passed write, read, and delete checks",
            );
        } catch (Throwable) {
            return $this->failed();
        } finally {
            if ($written) {
                try {
                    $this->files->delete($path);
                } catch (Throwable) {
                    // The failed cleanup belongs to the failed probe. Do not
                    // replace its useful requirement result with an exception.
                }
            }
        }
    }

    private function failed(): RequirementCheck
    {
        return new RequirementCheck(
            'File Store',
            false,
            "The {$this->files->diskName()} disk could not complete write, read, and delete checks",
        );
    }
}
