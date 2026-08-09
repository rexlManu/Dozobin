<?php

namespace App\Models;

use App\Enums\Expiration;
use App\Enums\RegistrationMode;
use Carbon\CarbonImmutable;
use Database\Factories\InstallationSettingFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property bool $guest_sharing
 * @property RegistrationMode $registration
 * @property list<string> $guest_expirations
 * @property list<string> $member_expirations
 * @property Expiration $guest_default_expiration
 * @property Expiration $member_default_expiration
 * @property bool $guest_password_protection
 * @property int $default_quota_mb
 * @property int $max_upload_mb
 * @property string $file_type_mode
 * @property list<string> $file_type_list
 * @property int $transfer_window_hours
 * @property int $payload_cleanup_grace_hours
 * @property bool $malware_scanning_enabled
 * @property string|null $tracking_code
 * @property CarbonImmutable|null $installed_at
 */
class InstallationSetting extends Model
{
    /** @use HasFactory<InstallationSettingFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'guest_sharing', 'registration', 'guest_expirations', 'member_expirations',
        'guest_default_expiration', 'member_default_expiration', 'guest_password_protection',
        'default_quota_mb', 'max_upload_mb', 'file_type_mode', 'file_type_list',
        'transfer_window_hours', 'payload_cleanup_grace_hours', 'malware_scanning_enabled',
        'tracking_code',
    ];

    public static function current(): self
    {
        return self::query()->firstOrCreate([], self::defaults());
    }

    /**
     * What a brand new installation starts from. Also what the installation
     * wizard shows before there is a row to read.
     *
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        return [
            'guest_sharing' => true,
            'registration' => RegistrationMode::Open,
            'guest_expirations' => ['1h', '1d', '7d'],
            'member_expirations' => ['1h', '1d', '7d', '30d', 'never'],
            'guest_default_expiration' => Expiration::OneDay,
            'member_default_expiration' => Expiration::SevenDays,
            'guest_password_protection' => true,
            'default_quota_mb' => 5120,
            'max_upload_mb' => 512,
            'file_type_mode' => 'block',
            'file_type_list' => ['exe', 'msi', 'bat', 'cmd'],
            'transfer_window_hours' => 12,
            'payload_cleanup_grace_hours' => 24,
            'malware_scanning_enabled' => false,
            'tracking_code' => null,
        ];
    }

    /**
     * Records that the wizard finished. Deliberately outside $fillable so the
     * settings form can never flip it.
     */
    public function markInstalled(): void
    {
        $this->forceFill(['installed_at' => now()])->save();
    }

    /** @return list<string> */
    public function expirationsFor(?User $user): array
    {
        return $user === null ? $this->guest_expirations : $this->member_expirations;
    }

    public function defaultExpirationFor(?User $user): Expiration
    {
        if ($user !== null && in_array($user->default_expiration->value, $this->member_expirations, true)) {
            return $user->default_expiration;
        }

        return $user === null ? $this->guest_default_expiration : $this->member_default_expiration;
    }

    protected function casts(): array
    {
        return [
            'guest_sharing' => 'boolean',
            'registration' => RegistrationMode::class,
            'guest_expirations' => 'array',
            'member_expirations' => 'array',
            'guest_default_expiration' => Expiration::class,
            'member_default_expiration' => Expiration::class,
            'guest_password_protection' => 'boolean',
            'default_quota_mb' => 'integer',
            'max_upload_mb' => 'integer',
            'file_type_list' => 'array',
            'transfer_window_hours' => 'integer',
            'payload_cleanup_grace_hours' => 'integer',
            'malware_scanning_enabled' => 'boolean',
            'installed_at' => 'immutable_datetime',
        ];
    }
}
