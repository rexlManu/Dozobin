<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\StartImpersonatingUserAction;
use App\Actions\Admin\StopImpersonatingUserAction;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ImpersonationController extends Controller
{
    public function store(Request $request, User $user, StartImpersonatingUserAction $start): JsonResponse
    {
        $start->handle($request, $request->user(), $user);

        return response()->json(status: 204);
    }

    public function destroy(Request $request, StopImpersonatingUserAction $stop): JsonResponse
    {
        abort_unless($request->session()->has('impersonator_id'), 404);
        $stop->handle($request);

        return response()->json(status: 204);
    }
}
