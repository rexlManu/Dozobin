<?php

namespace App\Console\Commands;

use App\Services\UpdateChecker;
use Illuminate\Console\Command;

final class CheckForUpdates extends Command
{
    protected $signature = 'updates:check {--refresh : Ignore the cached release result}';

    protected $description = 'Check whether a newer stable Dōzobin release exists';

    public function handle(UpdateChecker $updates): int
    {
        $status = $updates->status(refresh: (bool) $this->option('refresh'));

        if (! $status->checksEnabled) {
            $this->components->info('Update checks are disabled for this installation or build.');

            return self::SUCCESS;
        }

        if ($status->updateAvailable) {
            $this->components->warn("Dōzobin {$status->latestVersion} is available; this installation runs {$status->currentVersion}.");

            return self::SUCCESS;
        }

        $this->components->info('No newer stable release was found.');

        return self::SUCCESS;
    }
}
