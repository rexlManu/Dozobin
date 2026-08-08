<?php

namespace App\Jobs;

use App\Actions\Transfers\DeleteExpiredTransferSessionAction;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

final class DeleteExpiredTransferSessionJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $uniqueFor = 300;

    public function __construct(public readonly int $sessionId) {}

    public function uniqueId(): string
    {
        return (string) $this->sessionId;
    }

    public function handle(DeleteExpiredTransferSessionAction $delete): void
    {
        $delete->handle($this->sessionId);
    }
}
