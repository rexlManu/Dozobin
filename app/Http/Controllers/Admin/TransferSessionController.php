<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Transfers\DeleteTransferSessionAction;
use App\Actions\Transfers\TouchTransferSessionAction;
use App\Http\Controllers\Controller;
use App\Models\TransferSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class TransferSessionController extends Controller
{
    public function destroy(
        Request $request,
        TransferSession $transferSession,
        TouchTransferSessionAction $touch,
        DeleteTransferSessionAction $delete,
    ): JsonResponse {
        $this->authorize('delete', $transferSession);
        if ($request->boolean('forget')) {
            $delete->handle($transferSession);
        } else {
            $touch->expire($transferSession);
        }

        return response()->json(status: 204);
    }
}
