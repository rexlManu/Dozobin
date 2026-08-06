<?php

namespace App\Http\Resources;

use App\Models\InstallationSetting;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin InstallationSetting */
final class InstallationSettingResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'guestSharing' => $this->guest_sharing,
            'registration' => $this->registration->value,
            'guestExpirations' => $this->guest_expirations,
            'memberExpirations' => $this->member_expirations,
            'guestDefaultExpiration' => $this->guest_default_expiration->value,
            'memberDefaultExpiration' => $this->member_default_expiration->value,
            'guestPasswordProtection' => $this->guest_password_protection,
            'defaultQuotaMb' => $this->default_quota_mb,
            'maxUploadMb' => $this->max_upload_mb,
            'fileTypeMode' => $this->file_type_mode,
            'fileTypeList' => $this->file_type_list,
            'transferWindowHours' => $this->transfer_window_hours,
        ];
    }
}
