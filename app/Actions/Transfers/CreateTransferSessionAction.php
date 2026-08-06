<?php

namespace App\Actions\Transfers;

use App\Models\InstallationSetting;
use App\Models\TransferSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class CreateTransferSessionAction
{
    public function __construct(private ResolveTransferParticipantAction $resolveParticipant) {}

    public function handle(Request $request): TransferSession
    {
        return DB::transaction(function () use ($request): TransferSession {
            $settings = InstallationSetting::current();
            do {
                $code = Str::upper(Str::random(8));
            } while (TransferSession::query()->where('access_code', $code)->exists());

            $session = TransferSession::query()->create([
                'access_code' => $code,
                'last_activity_at' => now(),
                'expires_at' => now()->addHours($settings->transfer_window_hours),
            ]);
            $participant = $this->resolveParticipant->handle($request, $session);
            $session->activities()->create([
                'transfer_participant_id' => $participant->id,
                'actor' => $participant->label,
                'description' => 'created the session',
            ]);

            return $session->load(['items.participant', 'participants', 'activities']);
        });
    }
}
