<?php

namespace App\Policies;

use App\Enums\UserStatus;
use App\Models\InstallationSetting;
use App\Models\Share;
use App\Models\User;

final class SharePolicy
{
    public function before(?User $user): ?bool
    {
        return $user?->isAdmin() ? true : null;
    }

    public function create(?User $user): bool
    {
        if ($user !== null) {
            return $user->status === UserStatus::Active;
        }

        return InstallationSetting::current()->guest_sharing;
    }

    public function view(?User $user, Share $share): bool
    {
        return ! $share->hasExpired();
    }

    public function delete(User $user, Share $share): bool
    {
        return $share->user_id === $user->id;
    }

    public function scanMalware(User $user, Share $share): bool
    {
        return $user->isAdmin();
    }
}
