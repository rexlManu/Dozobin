<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Transfers\DeleteTransferSessionAction;
use App\Http\Controllers\Controller;
use App\Models\TransferSession;
use Illuminate\Http\JsonResponse;

final class TransferSessionController extends Controller
{
    public function destroy(
        TransferSession $transferSession,
        DeleteTransferSessionAction $delete,
    ): JsonResponse {
        $this->authorize('delete', $transferSession);
        $delete->handle($transferSession);

        return response()->json(status: 204);
    }
}
