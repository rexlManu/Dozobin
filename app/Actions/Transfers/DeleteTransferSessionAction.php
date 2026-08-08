<?php

namespace App\Actions\Transfers;

use App\Models\TransferSession;
use App\Services\FileStore;
use Illuminate\Support\Facades\DB;

final class DeleteTransferSessionAction
{
    public function __construct(private readonly FileStore $files) {}

    public function handle(TransferSession $session): void
    {
        $session->loadMissing('items');

        foreach ($session->items as $item) {
            if ($item->storage_path !== null
                && $this->files->exists($item->storage_path)) {
                $this->files->delete($item->storage_path);
            }
        }

        DB::transaction(fn () => $session->delete());
    }
}
