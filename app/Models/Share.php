<?php

namespace App\Models;

use App\Enums\MalwareScanStatus;
use App\Enums\PasteType;
use App\Enums\ShareKind;
use App\Enums\ShareState;
use Carbon\CarbonImmutable;
use Database\Factories\ShareFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $slug
 * @property int|null $user_id
 * @property ShareKind $kind
 * @property ShareState $state
 * @property MalwareScanStatus|null $malware_scan_status
 * @property string|null $malware_detected_name
 * @property string|null $malware_scan_error
 * @property CarbonImmutable|null $malware_scanned_at
 * @property string|null $filename
 * @property string|null $mime_type
 * @property int $size_bytes
 * @property string|null $storage_path
 * @property string|null $body
 * @property CarbonImmutable|null $payload_deleted_at
 * @property PasteType|null $paste_type
 * @property string|null $language
 * @property string|null $password
 * @property int $views
 * @property CarbonImmutable|null $expires_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
class Share extends Model
{
    /** @use HasFactory<ShareFactory> */
    use HasFactory, SoftDeletes;

    /** @var list<string> */
    protected $fillable = [
        'slug', 'user_id', 'kind', 'state', 'malware_scan_status', 'malware_detected_name',
        'malware_scan_error', 'malware_scanned_at', 'filename', 'mime_type', 'size_bytes',
        'storage_path', 'body', 'payload_deleted_at', 'paste_type', 'language', 'password',
        'views', 'expires_at',
    ];

    protected $hidden = ['password', 'storage_path'];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @param Builder<Share> $query */
    public function scopeAvailable(Builder $query): void
    {
        $query->where('state', ShareState::Ready)->where(fn (Builder $builder) => $builder
            ->whereNull('expires_at')
            ->orWhere('expires_at', '>', now()));
    }

    public function hasExpired(): bool
    {
        return $this->expires_at?->isPast() ?? false;
    }

    public function hasPayload(): bool
    {
        return $this->storage_path !== null || $this->body !== null;
    }

    /** @param Builder<Share> $query */
    public function scopePayloadCleanupDue(Builder $query, int $graceHours): void
    {
        $query
            ->whereNull('payload_deleted_at')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now()->subHours($graceHours))
            ->where(fn (Builder $builder) => $builder
                ->whereNotNull('storage_path')
                ->orWhereNotNull('body'));
    }

    protected function casts(): array
    {
        return [
            'kind' => ShareKind::class,
            'state' => ShareState::class,
            'malware_scan_status' => MalwareScanStatus::class,
            'paste_type' => PasteType::class,
            'size_bytes' => 'integer',
            'views' => 'integer',
            'expires_at' => 'immutable_datetime',
            'payload_deleted_at' => 'immutable_datetime',
            'malware_scanned_at' => 'immutable_datetime',
        ];
    }
}
