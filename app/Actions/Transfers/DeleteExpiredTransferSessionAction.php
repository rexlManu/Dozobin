<?php

namespace App\Actions\Transfers;

use App\Models\TransferSession;

final class DeleteExpiredTransferSessionAction
{
    public function __construct(private DeleteTransferSessionAction $delete) {}

    public function handle(int $sessionId): void
    {
        $session = TransferSession::query()->find($sessionId);
        if ($session === null || $session->expires_at->isFuture()) {
            return;
        }

        $this->delete->handle($session);
    }
}
