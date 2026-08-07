<?php

namespace App\Actions\Admin;

use Illuminate\Validation\ValidationException;
use Lab404\Impersonate\Services\ImpersonateManager;

final class StopImpersonatingUserAction
{
    public function __construct(private ImpersonateManager $impersonation) {}

    public function handle(): void
    {
        if (! $this->impersonation->isImpersonating() || ! $this->impersonation->leave()) {
            throw ValidationException::withMessages([
                'impersonation' => 'The administrator session is no longer available.',
            ]);
        }
    }
}
