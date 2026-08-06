<?php

namespace App\Actions\Admin;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Validation\ValidationException;

final class UpdateUserAction
{
    /** @param array<string, mixed> $data */
    public function handle(User $actor, User $target, array $data): User
    {
        $locksOut = ($data['role'] ?? null) === UserRole::Member->value
            || ($data['status'] ?? null) === UserStatus::Suspended->value;
        if ($actor->is($target) && $locksOut) {
            throw ValidationException::withMessages(['role' => 'You cannot lock your own administrator account.']);
        }

        $wouldRemoveAdmin = $target->role === UserRole::Admin && $locksOut;
        if ($wouldRemoveAdmin && User::query()->where('role', UserRole::Admin)->where('status', UserStatus::Active)->count() <= 1) {
            throw ValidationException::withMessages(['role' => 'The installation must keep one active administrator.']);
        }

        $target->fill($data);
        if (($data['status'] ?? null) === UserStatus::Suspended->value) {
            $target->suspended_at = now();
        } elseif (($data['status'] ?? null) === UserStatus::Active->value) {
            $target->suspended_at = null;
        }
        $target->save();

        return $target->refresh();
    }
}
