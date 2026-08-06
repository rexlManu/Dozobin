<?php

namespace App\Http\Resources;

use App\Models\ApiToken;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ApiToken */
final class ApiTokenResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $secret = $request->session()->pull("api_token_secret_{$this->id}");

        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'secret' => $secret ?? $this->token_preview,
            'createdAt' => $this->created_at?->getTimestampMs(),
            'lastUsedAt' => $this->last_used_at?->getTimestampMs(),
            'revoked' => $this->revoked_at !== null,
            'justCreated' => $secret !== null,
        ];
    }
}
