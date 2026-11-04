<?php

namespace App\Actions\Transfers;

use App\Models\TransferSession;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

final class JoinTransferSessionAction
{
    public function __construct(
        private ResolveTransferParticipantAction $resolveParticipant,
        private TouchTransferSessionAction $touch,
        private DeleteTransferSessionAction $delete,
    ) {}

    public function handle(Request $request, string $code): TransferSession
    {
        $session = TransferSession::query()->where('access_code', strtoupper($code))->first();
        if ($session === null) {
            throw ValidationException::withMessages(['code' => 'No live session uses that Access Code.']);
        }
        if ($session->hasExpired()) {
            $this->delete->handle($session);
            throw ValidationException::withMessages(['code' => 'That Transfer Session has expired.']);
        }

        $participant = $this->resolveParticipant->handle($request, $session);
        $arrived = $participant->wasRecentlyCreated || $participant->wasChanged('left_at');
        $this->touch->handle($session, $participant, $arrived ? 'joined the session' : null);

        return $session->fresh(['items.participant', 'participants', 'activities']);
    }
}
