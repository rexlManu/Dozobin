<?php

namespace App\Actions\Admin;

use App\Models\User;
use Illuminate\Validation\ValidationException;
use Lab404\Impersonate\Services\ImpersonateManager;

final class StartImpersonatingUserAction
{
    public function __construct(private ImpersonateManager $impersonation) {}

    public function handle(User $administrator, User $target): void
    {
        if (! $administrator->canImpersonate()
            || ! $target->canBeImpersonated()
            || $administrator->is($target)) {
            throw ValidationException::withMessages([
                'user' => 'This account cannot be impersonated.',
            ]);
        }

        if (! $this->impersonation->take($administrator, $target)) {
            throw ValidationException::withMessages([
                'user' => 'The impersonation session could not be started.',
            ]);
        }
    }
}
