<?php

namespace App\Actions\Transfers;

use App\Models\TransferItem;
use App\Models\TransferParticipant;
use Illuminate\Support\Facades\Storage;

final class DeleteTransferItemAction
{
    public function __construct(private TouchTransferSessionAction $touch) {}

    public function handle(TransferItem $item, TransferParticipant $participant): void
    {
        $session = $item->transferSession;
        if ($item->storage_path !== null) {
            Storage::delete($item->storage_path);
        }
        $name = $item->name;
        $item->delete();
        $this->touch->handle($session, $participant, 'deleted '.$name);
    }
}
