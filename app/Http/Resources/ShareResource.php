<?php

namespace App\Http\Resources;

use App\Enums\MalwareScanStatus;
use App\Enums\PasteType;
use App\Enums\ShareKind;
use App\Enums\ShareState;
use App\Models\Share;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Share */
final class ShareResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $canRead = $this->password === null
            || $request->session()->has("share_unlocked_{$this->slug}")
            || ($request->user() !== null && $request->user()->id === $this->user_id)
            || ($request->user()?->isAdmin() ?? false);
        $isAdmin = $request->user()?->isAdmin() ?? false;
        $ownerCanSeeDetection = $request->user() !== null
            && $request->user()->id === $this->user_id
            && $this->malware_scan_status === MalwareScanStatus::Detected;
        $canSeeScan = $isAdmin || $ownerCanSeeDetection;

        $base = [
            'id' => $this->slug,
            'kind' => $this->kind->value,
            'ownerId' => $this->user_id === null ? null : (string) $this->user_id,
            'createdAt' => $this->created_at?->getTimestampMs(),
            'expiresAt' => $this->expires_at?->getTimestampMs(),
            'password' => $this->password === null ? null : 'protected',
            'views' => $this->views,
            'state' => $this->state->value,
            'payloadDeletedAt' => $canSeeScan ? $this->payload_deleted_at?->getTimestampMs() : null,
            'hasPayload' => $canSeeScan ? $this->hasPayload() : null,
            'malwareScan' => $canSeeScan ? [
                'status' => $this->malware_scan_status?->value,
                'detectionName' => $this->malware_detected_name,
                'error' => $isAdmin ? $this->malware_scan_error : null,
                'scannedAt' => $this->malware_scanned_at?->getTimestampMs(),
            ] : null,
        ];

        if ($this->kind === ShareKind::File) {
            return $base + [
                'filename' => $canRead ? $this->filename : '',
                'mime' => $canRead ? $this->mime_type : 'application/octet-stream',
                'size' => $canRead ? $this->size_bytes : 0,
                'demoSrc' => $canRead
                    && $this->state === ShareState::Ready
                    && ! $this->hasExpired()
                    && $this->storage_path !== null
                        ? route('shares.content', $this->resource)
                        : null,
            ];
        }

        return $base + [
            'body' => $canRead ? $this->body : '',
            'pasteType' => $this->paste_type instanceof PasteType ? $this->paste_type->value : 'text',
            'language' => $this->language,
        ];
    }
}
