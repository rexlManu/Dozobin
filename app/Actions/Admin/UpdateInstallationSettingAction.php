<?php

namespace App\Actions\Admin;

use App\Models\InstallationSetting;

final class UpdateInstallationSettingAction
{
    /** @param array<string, mixed> $data */
    public function handle(InstallationSetting $settings, array $data): InstallationSetting
    {
        $settings->update([
            'guest_sharing' => $data['guestSharing'],
            'registration' => $data['registration'],
            'guest_expirations' => $data['guestExpirations'],
            'member_expirations' => $data['memberExpirations'],
            'guest_default_expiration' => $data['guestDefaultExpiration'],
            'member_default_expiration' => $data['memberDefaultExpiration'],
            'guest_password_protection' => $data['guestPasswordProtection'],
            'default_quota_mb' => $data['defaultQuotaMb'],
            'max_upload_mb' => $data['maxUploadMb'],
            'file_type_mode' => $data['fileTypeMode'],
            'file_type_list' => array_values(array_unique(array_map('strtolower', $data['fileTypeList']))),
            'transfer_window_hours' => $data['transferWindowHours'],
        ]);

        return $settings->refresh();
    }
}
