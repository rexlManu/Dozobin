<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\StartImpersonatingUserAction;
use App\Actions\Admin\StopImpersonatingUserAction;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Lab404\Impersonate\Services\ImpersonateManager;

final class ImpersonationController extends Controller
{
    public function store(Request $request, User $user, StartImpersonatingUserAction $start): JsonResponse|RedirectResponse
    {
        $this->authorize('impersonate', $user);
        $start->handle($request->user(), $user);

        return $request->expectsJson()
            ? response()->json(status: 204)
            : to_route('home');
    }

    public function destroy(Request $request, StopImpersonatingUserAction $stop, ImpersonateManager $impersonation): JsonResponse|RedirectResponse
    {
        abort_unless($impersonation->isImpersonating(), 404);
        $stop->handle();

        return $request->expectsJson()
            ? response()->json(status: 204)
            : to_route('admin.users.index');
    }
}
