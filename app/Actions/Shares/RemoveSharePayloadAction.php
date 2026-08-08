<?php

namespace App\Actions\Shares;

use App\Enums\ShareKind;
use App\Models\Share;
use App\Services\FileStore;

final class RemoveSharePayloadAction
{
    public function __construct(private readonly FileStore $files) {}

    public function handle(Share $share): void
    {
        if ($share->payload_deleted_at !== null) {
            return;
        }

        if ($share->kind === ShareKind::File && $share->storage_path !== null) {
            $path = $share->storage_path;
            if ($this->files->exists($path)) {
                $this->files->delete($path);
            }
        }

        $share->update([
            'storage_path' => null,
            'body' => null,
            'payload_deleted_at' => now(),
        ]);
    }
}
