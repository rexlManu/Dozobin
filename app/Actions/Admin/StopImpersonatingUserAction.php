<?php

namespace App\Actions\Admin;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

final class StopImpersonatingUserAction
{
    public function handle(Request $request): User
    {
        $administrator = User::query()
            ->whereKey($request->session()->get('impersonator_id'))
            ->where('role', UserRole::Admin)
            ->where('status', UserStatus::Active)
            ->first();

        if ($administrator === null) {
            throw ValidationException::withMessages([
                'impersonation' => 'The administrator session is no longer available.',
            ]);
        }

        $request->session()->forget('impersonator_id');
        Auth::login($administrator);
        $request->session()->regenerate();

        return $administrator;
    }
}
