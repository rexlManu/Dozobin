<?php

namespace Database\Factories;

use App\Models\InstallationSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InstallationSetting>
 */
class InstallationSettingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'guest_sharing' => true,
            'registration' => 'open',
            'guest_expirations' => ['1h', '1d', '7d'],
            'member_expirations' => ['1h', '1d', '7d', '30d', 'never'],
            'guest_default_expiration' => '1d',
            'member_default_expiration' => '7d',
            'guest_password_protection' => true,
            'default_quota_mb' => 5120,
            'max_upload_mb' => 512,
            'file_type_mode' => 'block',
            'file_type_list' => ['exe', 'msi', 'bat', 'cmd'],
            'transfer_window_hours' => 12,
            'payload_cleanup_grace_hours' => 24,
            'malware_scanning_enabled' => false,
        ];
    }
}
