<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Accounts\EndLoginSessionAction;
use App\Actions\Admin\UpdateUserAction;
use App\Actions\Shares\DeleteSharesAction;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAdminUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

final class UserController extends Controller
{
    public function update(UpdateAdminUserRequest $request, User $user, UpdateUserAction $update): UserResource
    {
        return UserResource::make($update->handle($request->user(), $user, $request->validated())->load('apiTokens'));
    }

    public function destroy(Request $request, User $user, DeleteSharesAction $deleteShares): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);
        if ($request->user()->is($user)) {
            throw ValidationException::withMessages(['user' => 'You cannot delete your own administrator account.']);
        }
        if ($user->role === UserRole::Admin && $user->status === UserStatus::Active
            && User::query()->where('role', UserRole::Admin)->where('status', UserStatus::Active)->count() <= 1) {
            throw ValidationException::withMessages(['user' => 'The installation must keep one active administrator.']);
        }
        $deleteShares->handle($request->user(), $user->shares()->get());
        $user->delete();

        return response()->json(status: 204);
    }

    public function destroySession(Request $request, User $user, string $session, EndLoginSessionAction $end): JsonResponse
    {
        $end->handle($request, $user, $session);

        return response()->json(status: 204);
    }
}
