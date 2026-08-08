<?php

namespace App\Jobs;

use App\Actions\Shares\CleanupExpiredSharePayloadAction;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

final class CleanupExpiredSharePayloadJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $uniqueFor = 3600;

    public function __construct(public readonly int $shareId) {}

    public function uniqueId(): string
    {
        return (string) $this->shareId;
    }

    public function handle(CleanupExpiredSharePayloadAction $cleanup): void
    {
        $cleanup->handle($this->shareId);
    }
}
