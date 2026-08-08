<?php

namespace App\Actions\Shares;

use App\Enums\ShareKind;
use App\Models\Share;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

final class RemoveSharePayloadAction
{
    public function handle(Share $share): void
    {
        if ($share->payload_deleted_at !== null) {
            return;
        }

        if ($share->kind === ShareKind::File && $share->storage_path !== null) {
            $path = $share->storage_path;
            if (Storage::exists($path) && ! Storage::delete($path)) {
                throw new RuntimeException("The Share payload at {$path} could not be deleted.");
            }
        }

        $share->update([
            'storage_path' => null,
            'body' => null,
            'payload_deleted_at' => now(),
        ]);
    }
}
