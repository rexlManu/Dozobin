<?php

namespace App\Policies;

use App\Models\ApiToken;
use App\Models\User;

final class ApiTokenPolicy
{
    public function delete(User $user, ApiToken $token): bool
    {
        return $user->isAdmin() || $token->user_id === $user->id;
    }
}
