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
    ) {}

    public function handle(Request $request, string $code): TransferSession
    {
        $session = TransferSession::query()->where('access_code', strtoupper($code))->first();
        if ($session === null) {
            throw ValidationException::withMessages(['code' => 'No live session uses that Access Code.']);
        }
        if ($session->hasExpired()) {
            $this->touch->expire($session);
            throw ValidationException::withMessages(['code' => 'That Transfer Session has expired.']);
        }

        $participant = $this->resolveParticipant->handle($request, $session);
        $this->touch->handle($session, $participant, 'joined the session');

        return $session->fresh(['items.participant', 'participants', 'activities']);
    }
}
