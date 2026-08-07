<?php

namespace App\Policies;

use App\Models\TransferSession;
use App\Models\User;

final class TransferSessionPolicy
{
    public function delete(User $user, TransferSession $session): bool
    {
        return $user->isAdmin();
    }
}
