<?php

namespace App\Http\Resources;

use App\Models\InviteCode;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin InviteCode */
final class InviteCodeResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'shareUrl' => route('register', ['invite' => $this->code]),
            'maxUses' => $this->max_uses,
            'uses' => $this->uses,
            'expiresAt' => $this->expires_at?->getTimestampMs(),
            'revokedAt' => $this->revoked_at?->getTimestampMs(),
            'createdAt' => $this->created_at?->getTimestampMs(),
            'status' => $this->status(),
        ];
    }
}
