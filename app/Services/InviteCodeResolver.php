<?php

namespace App\Services;

use App\Models\InviteCode;

final class InviteCodeResolver
{
    public function findAvailable(string $code, bool $lockForUpdate = false): ?InviteCode
    {
        $query = InviteCode::query()
            ->where('code_hash', InviteCode::hashCode($code));

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        $invite = $query->first();

        return $invite?->isAvailable() === true ? $invite : null;
    }

    public function matchesLegacyCode(string $code): bool
    {
        $legacyCode = config('dozobin.invite_code');

        return is_string($legacyCode)
            && $legacyCode !== ''
            && hash_equals(
                InviteCode::hashCode($legacyCode),
                InviteCode::hashCode($code),
            );
    }
}
