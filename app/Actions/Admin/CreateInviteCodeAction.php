<?php

namespace App\Actions\Admin;

use App\Models\InviteCode;
use App\Models\User;

final class CreateInviteCodeAction
{
    /** @param array{name: string, max_uses: int|null, expires_at: string|null} $data */
    public function handle(User $creator, array $data): InviteCode
    {
        do {
            $code = $this->generateCode();
            $hash = InviteCode::hashCode($code);
        } while (InviteCode::query()->where('code_hash', $hash)->exists());

        return InviteCode::query()->create([
            'created_by_user_id' => $creator->id,
            'name' => $data['name'],
            'code' => $code,
            'code_hash' => $hash,
            'max_uses' => $data['max_uses'],
            'expires_at' => $data['expires_at'],
        ]);
    }

    private function generateCode(): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $groups = [];

        for ($group = 0; $group < 3; $group++) {
            $value = '';

            for ($character = 0; $character < 4; $character++) {
                $value .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }

            $groups[] = $value;
        }

        return 'DOZO-'.implode('-', $groups);
    }
}
