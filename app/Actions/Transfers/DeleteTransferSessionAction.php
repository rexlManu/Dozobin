<?php

namespace App\Actions\Transfers;

use App\Models\TransferSession;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

final class DeleteTransferSessionAction
{
    public function handle(TransferSession $session): void
    {
        $session->loadMissing('items');

        foreach ($session->items as $item) {
            if ($item->storage_path !== null
                && Storage::exists($item->storage_path)
                && ! Storage::delete($item->storage_path)) {
                throw new RuntimeException("The Transfer Item payload at {$item->storage_path} could not be deleted.");
            }
        }

        DB::transaction(fn () => $session->delete());
    }
}
