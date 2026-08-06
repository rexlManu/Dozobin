<?php

namespace App\Http\Resources;

use App\Enums\TransferItemKind;
use App\Models\TransferItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TransferItem */
final class TransferItemResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'kind' => $this->kind->value,
            'name' => $this->name,
            'mime' => $this->mime_type,
            'size' => $this->size_bytes,
            'body' => $this->kind === TransferItemKind::Text ? $this->body : null,
            'demoSrc' => $this->storage_path ? route('transfer-items.content', $this->resource) : null,
            'addedBy' => $this->participant === null ? '' : (string) $this->participant->id,
            'addedAt' => $this->created_at?->getTimestampMs(),
        ];
    }
}
