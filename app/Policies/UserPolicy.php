<?php

namespace App\Policies;

use App\Models\User;

final class UserPolicy
{
    public function before(User $user): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    public function update(User $user, User $target): bool
    {
        return $user->is($target);
    }

    public function delete(User $user, User $target): bool
    {
        return $user->is($target);
    }
}
