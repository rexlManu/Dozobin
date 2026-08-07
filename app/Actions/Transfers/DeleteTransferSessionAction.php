<?php

namespace App\Actions\Transfers;

use App\Models\TransferSession;

final class DeleteTransferSessionAction
{
    public function __construct(private TouchTransferSessionAction $touch) {}

    public function handle(TransferSession $session): void
    {
        $this->touch->expire($session);
        $session->delete();
    }
}
