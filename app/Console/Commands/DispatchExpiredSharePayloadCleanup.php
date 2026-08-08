<?php

namespace App\Console\Commands;

use App\Actions\Shares\DispatchExpiredSharePayloadCleanupAction;
use Illuminate\Console\Command;

final class DispatchExpiredSharePayloadCleanup extends Command
{
    protected $signature = 'shares:cleanup-expired-payloads';

    protected $description = 'Queue payload cleanup for expired Shares';

    public function handle(DispatchExpiredSharePayloadCleanupAction $dispatch): int
    {
        $queued = $dispatch->handle();

        $this->info("Queued {$queued} expired Share payload cleanup job(s).");

        return self::SUCCESS;
    }
}
