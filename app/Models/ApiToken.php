<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\ApiTokenFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string $token_hash
 * @property string $token_preview
 * @property CarbonImmutable|null $last_used_at
 * @property CarbonImmutable|null $revoked_at
 * @property CarbonImmutable|null $created_at
 */
class ApiToken extends Model
{
    /** @use HasFactory<ApiTokenFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = ['user_id', 'name', 'token_hash', 'token_preview', 'last_used_at', 'revoked_at'];

    protected $hidden = ['token_hash'];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return ['last_used_at' => 'immutable_datetime', 'revoked_at' => 'immutable_datetime'];
    }
}
