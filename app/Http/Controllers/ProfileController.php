<?php

namespace App\Http\Controllers;

use App\Actions\Accounts\DeleteAccountAction;
use App\Actions\Accounts\EndLoginSessionAction;
use App\Actions\Accounts\UpdateProfileAction;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

final class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request, UpdateProfileAction $update): UserResource
    {
        return UserResource::make($update->handle(
            $request->user(),
            $request->validated(),
            $request->file('avatar'),
        )->load('apiTokens'));
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $request->user()->update(['password' => $request->string('password')->toString()]);

        return response()->json(status: 204);
    }

    public function destroy(Request $request, DeleteAccountAction $delete): JsonResponse
    {
        $user = $request->user();
        $delete->handle($user);
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(status: 204);
    }

    public function destroySession(Request $request, string $session, EndLoginSessionAction $end): JsonResponse
    {
        $end->handle($request, $request->user(), $session);

        return response()->json(status: 204);
    }
}
