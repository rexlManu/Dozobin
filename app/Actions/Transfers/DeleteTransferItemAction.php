<?php

namespace App\Actions\Transfers;

use App\Models\TransferItem;
use App\Models\TransferParticipant;
use App\Services\FileStore;

final class DeleteTransferItemAction
{
    public function __construct(
        private readonly TouchTransferSessionAction $touch,
        private readonly FileStore $files,
    ) {}

    public function handle(TransferItem $item, TransferParticipant $participant): void
    {
        $session = $item->transferSession;
        if ($item->storage_path !== null && $this->files->exists($item->storage_path)) {
            $this->files->delete($item->storage_path);
        }
        $name = $item->name;
        $item->delete();
        $this->touch->handle($session, $participant, 'deleted '.$name);
    }
}
