<?php

namespace App\Http\Controllers;

use App\Http\Requests\SendPasswordResetLinkRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Password;

final class PasswordResetLinkController extends Controller
{
    public function __invoke(SendPasswordResetLinkRequest $request): RedirectResponse
    {
        Password::sendResetLink($request->only('email'));

        return back()->with('status', 'If that address has an account, a reset link is on its way.');
    }
}
