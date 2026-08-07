<?php

namespace App\Http\Controllers;

use App\Actions\Accounts\DeleteAccountAction;
use App\Actions\Accounts\EndLoginSessionAction;
use App\Actions\Accounts\UpdateProfileAction;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

final class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request, UpdateProfileAction $update): UserResource|RedirectResponse
    {
        $user = $update->handle(
            $request->user(),
            $request->validated(),
            $request->file('avatar'),
        );

        if ($request->expectsJson()) {
            return UserResource::make($user->load('apiTokens'));
        }

        return back()->with('status', 'Profile updated.');
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse|RedirectResponse
    {
        $request->user()->update(['password' => $request->string('password')->toString()]);

        return $request->expectsJson()
            ? response()->json(status: 204)
            : back()->with('status', 'Password updated.');
    }

    public function destroy(Request $request, DeleteAccountAction $delete): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $delete->handle($user);
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $request->expectsJson()
            ? response()->json(status: 204)
            : to_route('home');
    }

    public function destroySession(Request $request, string $session, EndLoginSessionAction $end): JsonResponse|RedirectResponse
    {
        $end->handle($request, $request->user(), $session);

        return $request->expectsJson()
            ? response()->json(status: 204)
            : back()->with('status', 'Session ended.');
    }
}
