<?php

namespace App\Http\Resources;

use App\Models\TakedownRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TakedownRequest */
final class TakedownRequestResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'shareUrl' => $this->share_url,
            'reason' => $this->reason->value,
            'details' => $this->details,
            'reporterName' => $this->reporter_name,
            'reporterEmail' => $this->reporter_email,
            'status' => $this->status->value,
            'handledBy' => $this->handler?->name,
            'handledAt' => $this->handled_at?->getTimestampMs(),
            'createdAt' => $this->created_at?->getTimestampMs(),
            'share' => $this->share === null ? null : [
                'id' => $this->share->slug,
                'kind' => $this->share->kind->value,
                'name' => $this->share->filename,
                'state' => $this->share->state->value,
                'url' => $this->share->url(),
                'owner' => $this->share->user?->name,
            ],
        ];
    }
}
