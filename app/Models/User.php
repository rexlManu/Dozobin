<?php

namespace App\Models;

use App\Enums\Appearance;
use App\Enums\Expiration;
use App\Enums\UserRole;
use App\Enums\UserStatus;
// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Carbon\CarbonImmutable;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Lab404\Impersonate\Models\Impersonate;

/**
 * @property int $id
 * @property int|null $invite_code_id
 * @property string $name
 * @property string $email
 * @property CarbonImmutable|null $email_verified_at
 * @property string $password
 * @property UserRole $role
 * @property UserStatus $status
 * @property string|null $avatar_path
 * @property string|null $dismissed_update_version
 * @property Appearance $appearance
 * @property Expiration $default_expiration
 * @property int $storage_limit
 * @property CarbonImmutable|null $suspended_at
 * @property string|null $remember_token
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Impersonate, Notifiable;

    /** @var list<string> */
    protected $fillable = [
        'invite_code_id', 'name', 'email', 'password', 'role', 'status', 'avatar_path', 'appearance',
        'default_expiration', 'storage_limit', 'suspended_at',
    ];

    /** @return HasMany<Share, $this> */
    public function shares(): HasMany
    {
        return $this->hasMany(Share::class);
    }

    /** @return HasMany<ApiToken, $this> */
    public function apiTokens(): HasMany
    {
        return $this->hasMany(ApiToken::class);
    }

    /** @return BelongsTo<InviteCode, $this> */
    public function inviteCode(): BelongsTo
    {
        return $this->belongsTo(InviteCode::class);
    }

    /** @return HasMany<InviteCode, $this> */
    public function createdInviteCodes(): HasMany
    {
        return $this->hasMany(InviteCode::class, 'created_by_user_id');
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    public function canImpersonate(): bool
    {
        return $this->isAdmin() && $this->status === UserStatus::Active;
    }

    public function canBeImpersonated(): bool
    {
        return $this->status === UserStatus::Active;
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'immutable_datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'status' => UserStatus::class,
            'appearance' => Appearance::class,
            'default_expiration' => Expiration::class,
            'storage_limit' => 'integer',
            'suspended_at' => 'immutable_datetime',
        ];
    }
}
