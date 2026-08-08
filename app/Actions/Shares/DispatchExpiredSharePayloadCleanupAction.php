<?php

namespace App\Actions\Shares;

use App\Jobs\CleanupExpiredSharePayloadJob;
use App\Models\InstallationSetting;
use App\Models\Share;

final class DispatchExpiredSharePayloadCleanupAction
{
    public function handle(): int
    {
        $graceHours = InstallationSetting::current()->payload_cleanup_grace_hours;
        $queued = 0;

        Share::query()
            ->payloadCleanupDue($graceHours)
            ->select('id')
            ->chunkById(200, function ($shares) use (&$queued): void {
                foreach ($shares as $share) {
                    CleanupExpiredSharePayloadJob::dispatch($share->id);
                    $queued++;
                }
            });

        return $queued;
    }
}
