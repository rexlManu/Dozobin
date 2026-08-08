<?php

namespace App\Actions\Shares;

use App\Models\InstallationSetting;
use App\Models\Share;

final class CleanupExpiredSharePayloadAction
{
    public function __construct(private RemoveSharePayloadAction $removePayload) {}

    public function handle(int $shareId): void
    {
        $share = Share::query()->find($shareId);
        if ($share === null || ! $share->hasPayload() || $share->payload_deleted_at !== null) {
            return;
        }

        $graceHours = InstallationSetting::current()->payload_cleanup_grace_hours;
        if ($share->expires_at === null || $share->expires_at->isAfter(now()->subHours($graceHours))) {
            return;
        }

        $this->removePayload->handle($share);
    }
}
