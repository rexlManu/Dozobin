<?php

namespace App\Console\Commands;

use App\Jobs\DeleteExpiredTransferSessionJob;
use App\Models\TransferSession;
use Illuminate\Console\Command;

final class DispatchExpiredTransferSessionCleanup extends Command
{
    protected $signature = 'transfers:cleanup-expired';

    protected $description = 'Queue deletion for expired Transfer Sessions';

    public function handle(): int
    {
        $queued = 0;

        TransferSession::query()
            ->where('expires_at', '<=', now())
            ->select('id')
            ->chunkById(200, function ($sessions) use (&$queued): void {
                foreach ($sessions as $session) {
                    DeleteExpiredTransferSessionJob::dispatch($session->id);
                    $queued++;
                }
            });

        $this->info("Queued {$queued} expired Transfer Session cleanup job(s).");

        return self::SUCCESS;
    }
}
