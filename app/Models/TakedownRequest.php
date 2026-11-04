<?php

namespace App\Models;

use App\Enums\TakedownReason;
use App\Enums\TakedownStatus;
use Carbon\CarbonImmutable;
use Database\Factories\TakedownRequestFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A report that a Share URL holds content that should come down. Anyone can
 * send one; administrators resolve or dismiss it.
 *
 * @property int $id
 * @property int|null $share_id
 * @property string $share_url
 * @property TakedownReason $reason
 * @property string $details
 * @property string|null $reporter_name
 * @property string $reporter_email
 * @property TakedownStatus $status
 * @property int|null $handled_by_user_id
 * @property CarbonImmutable|null $handled_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
class TakedownRequest extends Model
{
    /** @use HasFactory<TakedownRequestFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'share_id', 'share_url', 'reason', 'details', 'reporter_name', 'reporter_email',
        'status', 'handled_by_user_id', 'handled_at',
    ];

    /** @return BelongsTo<Share, $this> */
    public function share(): BelongsTo
    {
        return $this->belongsTo(Share::class);
    }

    /** @return BelongsTo<User, $this> */
    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by_user_id');
    }

    protected function casts(): array
    {
        return [
            'reason' => TakedownReason::class,
            'status' => TakedownStatus::class,
            'handled_at' => 'immutable_datetime',
        ];
    }
}
