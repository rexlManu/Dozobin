<?php

namespace App\Actions\Shares;

use App\Data\CreatePasteData;
use App\Enums\ShareKind;
use App\Enums\ShareState;
use App\Models\Share;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

final class CreatePasteAction
{
    public function handle(?User $user, CreatePasteData $data): Share
    {
        return Share::query()->create([
            'slug' => Str::lower(Str::random(20)),
            'user_id' => $user?->id,
            'kind' => ShareKind::Paste,
            'state' => ShareState::Ready,
            'size_bytes' => strlen($data->body),
            'body' => $data->body,
            'mime_type' => 'text/plain',
            'paste_type' => $data->pasteType,
            'language' => $data->language,
            'password' => $data->password === null ? null : Hash::make($data->password),
            'expires_at' => $data->expiration->expiresAt(),
        ]);
    }
}
