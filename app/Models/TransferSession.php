<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\TransferSessionFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $access_code
 * @property CarbonImmutable $last_activity_at
 * @property CarbonImmutable $expires_at
 * @property CarbonImmutable|null $expired_at
 * @property CarbonImmutable|null $created_at
 * @property-read Collection<int, TransferParticipant> $participants
 * @property-read Collection<int, TransferItem> $items
 * @property-read Collection<int, TransferActivity> $activities
 */
class TransferSession extends Model
{
    /** @use HasFactory<TransferSessionFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = ['access_code', 'last_activity_at', 'expires_at', 'expired_at'];

    public function getRouteKeyName(): string
    {
        return 'access_code';
    }

    /** @return HasMany<TransferParticipant, $this> */
    public function participants(): HasMany
    {
        return $this->hasMany(TransferParticipant::class);
    }

    /** @return HasMany<TransferItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(TransferItem::class);
    }

    /** @return HasMany<TransferActivity, $this> */
    public function activities(): HasMany
    {
        return $this->hasMany(TransferActivity::class);
    }

    public function hasExpired(): bool
    {
        return $this->expired_at !== null || $this->expires_at->isPast();
    }

    protected function casts(): array
    {
        return [
            'last_activity_at' => 'immutable_datetime',
            'expires_at' => 'immutable_datetime',
            'expired_at' => 'immutable_datetime',
        ];
    }
}
