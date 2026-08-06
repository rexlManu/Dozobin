<?php

namespace App\Http\Resources;

use App\Models\TransferActivity;
use App\Models\TransferParticipant;
use App\Models\TransferSession;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TransferSession */
final class TransferSessionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $browserId = (string) $request->session()->get('transfer_browser_id');

        return [
            'code' => $this->access_code,
            'createdAt' => $this->created_at?->getTimestampMs(),
            'lastActivityAt' => $this->last_activity_at->getTimestampMs(),
            'items' => $this->whenLoaded(
                'items',
                fn (): array => TransferItemResource::collection($this->items)->resolve($request),
            ),
            'participants' => $this->whenLoaded('participants', fn () => $this->participants->map(fn (TransferParticipant $participant): array => [
                'id' => (string) $participant->id,
                'label' => $participant->label,
                'device' => $participant->device,
                'joinedAt' => $participant->joined_at->getTimestampMs(),
                'self' => $participant->browser_id === $browserId,
            ])->all()),
            'activity' => $this->whenLoaded('activities', fn () => $this->activities->sortByDesc('created_at')->take(30)->values()->map(fn (TransferActivity $activity): array => [
                'id' => (string) $activity->id,
                'at' => $activity->created_at?->getTimestampMs(),
                'actor' => $activity->actor,
                'text' => $activity->description,
            ])->all()),
            'expired' => $this->hasExpired(),
            'leftLocally' => ! $this->participants->contains(fn ($participant): bool => $participant->browser_id === $browserId && $participant->left_at === null),
        ];
    }
}
