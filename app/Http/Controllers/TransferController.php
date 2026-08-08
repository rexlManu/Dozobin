<?php

namespace App\Http\Controllers;

use App\Actions\Transfers\CreateTransferSessionAction;
use App\Actions\Transfers\DeleteTransferSessionAction;
use App\Actions\Transfers\FindCurrentTransferSessionAction;
use App\Actions\Transfers\JoinTransferSessionAction;
use App\Actions\Transfers\ResolveTransferParticipantAction;
use App\Actions\Transfers\TouchTransferSessionAction;
use App\Http\Requests\JoinTransferSessionRequest;
use App\Http\Requests\TouchTransferSessionRequest;
use App\Http\Resources\TransferSessionResource;
use App\Models\TransferSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class TransferController extends Controller
{
    public function index(Request $request, FindCurrentTransferSessionAction $current): Response
    {
        $session = $current->handle($request);

        return Inertia::render('transfers/index', [
            'transfer' => fn () => $session === null
                ? null
                : (new TransferSessionResource($session))->resolve($request),
        ]);
    }

    public function store(Request $request, CreateTransferSessionAction $create): TransferSessionResource|RedirectResponse
    {
        $session = $create->handle($request);

        return $request->expectsJson()
            ? TransferSessionResource::make($session)
            : to_route('transfers.show', $session);
    }

    public function join(JoinTransferSessionRequest $request, JoinTransferSessionAction $join): TransferSessionResource|RedirectResponse
    {
        $session = $join->handle($request, $request->string('code')->toString());

        return $request->expectsJson()
            ? TransferSessionResource::make($session)
            : to_route('transfers.show', $session);
    }

    public function show(
        Request $request,
        TransferSession $transferSession,
        JoinTransferSessionAction $join,
        DeleteTransferSessionAction $delete,
    ): Response {
        if ($transferSession->hasExpired()) {
            $expired = [
                'code' => $transferSession->access_code,
                'createdAt' => $transferSession->created_at?->getTimestampMs(),
                'lastActivityAt' => $transferSession->last_activity_at->getTimestampMs(),
                'items' => [],
                'participants' => [],
                'activity' => [],
                'expired' => true,
                'leftLocally' => false,
            ];
            $delete->handle($transferSession);

            return Inertia::render('transfers/show', ['transfer' => $expired]);
        }

        $session = $join->handle($request, $transferSession->access_code);

        return Inertia::render('transfers/show', [
            'transfer' => fn () => (new TransferSessionResource($session))->resolve($request),
        ]);
    }

    public function touch(
        TouchTransferSessionRequest $request,
        TransferSession $transferSession,
        ResolveTransferParticipantAction $resolve,
        TouchTransferSessionAction $touch,
    ): JsonResponse {
        $participant = $resolve->handle($request, $transferSession);
        $description = $request->string('note')->trim()->toString();
        $touch->handle($transferSession, $participant, $description !== '' ? $description : 'refreshed the session');

        return response()->json(['expiresAt' => $transferSession->fresh()->expires_at->getTimestampMs()]);
    }

    public function leave(
        Request $request,
        TransferSession $transferSession,
        ResolveTransferParticipantAction $resolve,
    ): JsonResponse|RedirectResponse {
        $participant = $resolve->handle($request, $transferSession);
        $participant->update(['left_at' => now()]);
        $transferSession->activities()->create([
            'transfer_participant_id' => $participant->id,
            'actor' => $participant->label,
            'description' => 'left on this device',
        ]);

        return $request->expectsJson()
            ? response()->json(status: 204)
            : to_route('transfer.lobby');
    }
}
