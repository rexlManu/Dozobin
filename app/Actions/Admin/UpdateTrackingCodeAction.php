<?php

namespace App\Actions\Admin;

use App\Models\InstallationSetting;
use Illuminate\Support\Str;

final class UpdateTrackingCodeAction
{
    public function handle(InstallationSetting $settings, ?string $trackingCode): InstallationSetting
    {
        $normalizedCode = Str::of($trackingCode ?? '')->trim()->toString();

        $settings->update([
            'tracking_code' => $normalizedCode === '' ? null : $normalizedCode,
        ]);

        return $settings->refresh();
    }
}
