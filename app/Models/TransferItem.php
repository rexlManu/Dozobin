<?php

namespace App\Models;

use App\Enums\TransferItemKind;
use Carbon\CarbonImmutable;
use Database\Factories\TransferItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $transfer_session_id
 * @property int|null $transfer_participant_id
 * @property TransferItemKind $kind
 * @property string $name
 * @property string $mime_type
 * @property int $size_bytes
 * @property string|null $storage_path
 * @property string|null $body
 * @property CarbonImmutable|null $created_at
 * @property-read TransferSession $transferSession
 * @property-read TransferParticipant|null $participant
 */
class TransferItem extends Model
{
    /** @use HasFactory<TransferItemFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'transfer_session_id', 'transfer_participant_id', 'kind', 'name', 'mime_type',
        'size_bytes', 'storage_path', 'body',
    ];

    protected $hidden = ['storage_path'];

    /** @return BelongsTo<TransferSession, $this> */
    public function transferSession(): BelongsTo
    {
        return $this->belongsTo(TransferSession::class);
    }

    /** @return BelongsTo<TransferParticipant, $this> */
    public function participant(): BelongsTo
    {
        return $this->belongsTo(TransferParticipant::class, 'transfer_participant_id');
    }

    protected function casts(): array
    {
        return ['kind' => TransferItemKind::class, 'size_bytes' => 'integer'];
    }
}
