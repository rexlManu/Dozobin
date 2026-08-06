<?php

namespace App\Http\Controllers;

use App\Actions\Transfers\AddTransferItemAction;
use App\Actions\Transfers\DeleteTransferItemAction;
use App\Actions\Transfers\ResolveTransferParticipantAction;
use App\Http\Requests\StoreTransferItemRequest;
use App\Http\Resources\TransferItemResource;
use App\Models\TransferItem;
use App\Models\TransferSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class TransferItemController extends Controller
{
    public function store(
        StoreTransferItemRequest $request,
        TransferSession $transferSession,
        ResolveTransferParticipantAction $resolve,
        AddTransferItemAction $add,
    ): TransferItemResource {
        $participant = $resolve->handle($request, $transferSession);

        return TransferItemResource::make($add->handle(
            $transferSession,
            $participant,
            $request->file('file'),
            $request->filled('body') ? $request->string('body')->toString() : null,
        ));
    }

    public function destroy(
        Request $request,
        TransferSession $transferSession,
        TransferItem $transferItem,
        ResolveTransferParticipantAction $resolve,
        DeleteTransferItemAction $delete,
    ): JsonResponse {
        abort_unless($transferItem->transfer_session_id === $transferSession->id, 404);
        $delete->handle($transferItem, $resolve->handle($request, $transferSession));

        return response()->json(status: 204);
    }

    public function content(Request $request, TransferItem $transferItem): StreamedResponse
    {
        $session = $transferItem->transferSession;
        abort_if($session->hasExpired(), 404);
        $browserId = $request->session()->get('transfer_browser_id');
        abort_unless(is_string($browserId) && $session->participants()->where('browser_id', $browserId)->whereNull('left_at')->exists(), 403);
        abort_if($transferItem->storage_path === null || ! Storage::exists($transferItem->storage_path), 404);

        return Storage::response(
            $transferItem->storage_path,
            $transferItem->name,
            ['Content-Type' => $transferItem->mime_type, 'Content-Disposition' => 'inline'],
        );
    }
}
