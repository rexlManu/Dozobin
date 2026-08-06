<?php

namespace App\Http\Controllers;

use App\Actions\BuildAppStateAction;
use App\Actions\Transfers\CreateTransferSessionAction;
use App\Actions\Transfers\JoinTransferSessionAction;
use App\Actions\Transfers\ResolveTransferParticipantAction;
use App\Actions\Transfers\TouchTransferSessionAction;
use App\Http\Requests\JoinTransferSessionRequest;
use App\Http\Requests\TouchTransferSessionRequest;
use App\Http\Resources\TransferSessionResource;
use App\Models\TransferSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class TransferController extends Controller
{
    public function store(Request $request, CreateTransferSessionAction $create): TransferSessionResource
    {
        return TransferSessionResource::make($create->handle($request));
    }

    public function join(JoinTransferSessionRequest $request, JoinTransferSessionAction $join): TransferSessionResource
    {
        return TransferSessionResource::make($join->handle($request, $request->string('code')->toString()));
    }

    public function show(
        Request $request,
        TransferSession $transferSession,
        JoinTransferSessionAction $join,
        BuildAppStateAction $state,
    ): Response {
        $session = $join->handle($request, $transferSession->access_code);

        return Inertia::render('dozobin', [
            'screen' => 'transfer-session',
            'routeParams' => ['code' => $session->access_code],
            'state' => $state->handle($request, transfer: $session),
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
    ): JsonResponse {
        $participant = $resolve->handle($request, $transferSession);
        $participant->update(['left_at' => now()]);
        $transferSession->activities()->create([
            'transfer_participant_id' => $participant->id,
            'actor' => $participant->label,
            'description' => 'left on this device',
        ]);

        return response()->json(status: 204);
    }
}
