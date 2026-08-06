<?php

namespace App\Actions\Admin;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

final class StartImpersonatingUserAction
{
    public function handle(Request $request, User $administrator, User $target): void
    {
        if (! $administrator->isAdmin() || $administrator->is($target)) {
            throw ValidationException::withMessages([
                'user' => 'This account cannot be impersonated.',
            ]);
        }

        $request->session()->put('impersonator_id', $administrator->id);
        Auth::login($target);
        $request->session()->regenerate();
    }
}
