<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Transfers\TouchTransferSessionAction;
use App\Http\Controllers\Controller;
use App\Models\TransferSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class TransferSessionController extends Controller
{
    public function destroy(Request $request, TransferSession $transferSession, TouchTransferSessionAction $touch): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);
        $touch->expire($transferSession);

        return response()->json(status: 204);
    }
}
