<?php

namespace App\Policies;

use App\Models\User;

final class UserPolicy
{
    public function update(User $user, User $target): bool
    {
        return $user->isAdmin() || $user->is($target);
    }

    public function delete(User $user, User $target): bool
    {
        return $user->isAdmin() || $user->is($target);
    }

    public function manageSessions(User $user, User $target): bool
    {
        return $user->isAdmin() || $user->is($target);
    }

    public function impersonate(User $user, User $target): bool
    {
        return $user->canImpersonate()
            && $target->canBeImpersonated()
            && ! $user->is($target);
    }
}
