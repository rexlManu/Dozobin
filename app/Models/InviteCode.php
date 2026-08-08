<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\InviteCodeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int|null $created_by_user_id
 * @property string $name
 * @property string $code
 * @property string $code_hash
 * @property int|null $max_uses
 * @property int $uses
 * @property CarbonImmutable|null $expires_at
 * @property CarbonImmutable|null $revoked_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
class InviteCode extends Model
{
    /** @use HasFactory<InviteCodeFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'created_by_user_id', 'name', 'code', 'code_hash', 'max_uses', 'uses',
        'expires_at', 'revoked_at',
    ];

    /** @var list<string> */
    protected $hidden = ['code_hash'];

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /** @return HasMany<User, $this> */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function isAvailable(): bool
    {
        return $this->revoked_at === null
            && ($this->expires_at === null || $this->expires_at->isFuture())
            && ($this->max_uses === null || $this->uses < $this->max_uses);
    }

    /** @return 'active'|'expired'|'exhausted'|'revoked' */
    public function status(): string
    {
        if ($this->revoked_at !== null) {
            return 'revoked';
        }

        if ($this->expires_at !== null && ! $this->expires_at->isFuture()) {
            return 'expired';
        }

        if ($this->max_uses !== null && $this->uses >= $this->max_uses) {
            return 'exhausted';
        }

        return 'active';
    }

    public static function hashCode(string $code): string
    {
        return hash('sha256', mb_strtoupper(trim($code)));
    }

    protected function casts(): array
    {
        return [
            'code' => 'encrypted',
            'max_uses' => 'integer',
            'uses' => 'integer',
            'expires_at' => 'immutable_datetime',
            'revoked_at' => 'immutable_datetime',
        ];
    }
}
