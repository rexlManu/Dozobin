<?php

namespace App\Http\Resources;

use App\Models\Share;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin User */
final class UserResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $used = Share::query()
            ->where('user_id', $this->id)
            ->whereNull('deleted_at')
            ->sum('size_bytes');

        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'avatarSrc' => $this->avatar_path ? Storage::disk('public')->url($this->avatar_path) : '',
            'role' => $this->role->value,
            'createdAt' => $this->created_at?->getTimestampMs(),
            'status' => $this->status->value,
            'suspendedAt' => $this->suspended_at?->getTimestampMs(),
            'storageUsed' => (int) $used,
            'storageLimit' => $this->storage_limit,
            'defaultExpiration' => $this->default_expiration->value,
            'tokens' => $this->whenLoaded(
                'apiTokens',
                fn (): array => ApiTokenResource::collection($this->apiTokens)->resolve($request),
                [],
            ),
            'sessions' => $this->sessions($request),
        ];
    }

    /** @return list<array<string, mixed>> */
    private function sessions(Request $request): array
    {
        if (config('session.driver') !== 'database') {
            return [];
        }

        return array_values(\DB::table(config('session.table', 'sessions'))
            ->where('user_id', $this->id)
            ->orderByDesc('last_activity')
            ->get()
            ->map(fn (object $session): array => [
                'id' => (string) $session->id,
                'device' => str_contains((string) $session->user_agent, 'Mobile') ? 'Phone' : 'Computer',
                'browser' => $this->browser((string) $session->user_agent),
                'location' => (string) ($session->ip_address ?: 'Unknown'),
                'lastSeenAt' => (int) $session->last_activity * 1000,
                'current' => hash_equals($request->session()->getId(), (string) $session->id),
            ])->all());
    }

    private function browser(string $agent): string
    {
        return match (true) {
            str_contains($agent, 'Firefox') => 'Firefox',
            str_contains($agent, 'Edg/') => 'Edge',
            str_contains($agent, 'Chrome') => 'Chrome',
            str_contains($agent, 'Safari') => 'Safari',
            default => 'Browser',
        };
    }
}
