<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\TransferParticipantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $transfer_session_id
 * @property string $browser_id
 * @property string $label
 * @property string $device
 * @property CarbonImmutable $joined_at
 * @property CarbonImmutable|null $left_at
 */
class TransferParticipant extends Model
{
    /** @use HasFactory<TransferParticipantFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = ['transfer_session_id', 'browser_id', 'label', 'device', 'joined_at', 'left_at'];

    /** @return BelongsTo<TransferSession, $this> */
    public function transferSession(): BelongsTo
    {
        return $this->belongsTo(TransferSession::class);
    }

    /** @return HasMany<TransferItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(TransferItem::class);
    }

    protected function casts(): array
    {
        return ['joined_at' => 'immutable_datetime', 'left_at' => 'immutable_datetime'];
    }
}
