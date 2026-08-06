<?php

namespace App\Http\Controllers;

use App\Actions\Auth\AuthenticateUserAction;
use App\Actions\Auth\RegisterUserAction;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

final class AuthController extends Controller
{
    public function login(LoginRequest $request, AuthenticateUserAction $authenticate): RedirectResponse
    {
        $authenticate->handle(
            $request,
            $request->string('email')->toString(),
            $request->string('password')->toString(),
            $request->boolean('remember'),
        );

        return redirect()->intended(route('home'));
    }

    public function register(RegisterRequest $request, RegisterUserAction $register): RedirectResponse
    {
        $user = $register->handle([
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->toString(),
            'password' => $request->string('password')->toString(),
            'invite' => $request->filled('invite') ? $request->string('invite')->toString() : null,
        ]);
        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('home');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }
}
