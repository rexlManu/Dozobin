<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\TransferActivityFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $transfer_session_id
 * @property int|null $transfer_participant_id
 * @property string $actor
 * @property string $description
 * @property CarbonImmutable|null $created_at
 */
class TransferActivity extends Model
{
    /** @use HasFactory<TransferActivityFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = ['transfer_session_id', 'transfer_participant_id', 'actor', 'description'];

    /** @return BelongsTo<TransferSession, $this> */
    public function transferSession(): BelongsTo
    {
        return $this->belongsTo(TransferSession::class);
    }
}
