<?php

namespace App\Actions\Transfers;

use App\Models\InstallationSetting;
use App\Models\TransferParticipant;
use App\Models\TransferSession;
use Illuminate\Validation\ValidationException;

final class TouchTransferSessionAction
{
    public function __construct(private DeleteTransferSessionAction $delete) {}

    public function handle(TransferSession $session, ?TransferParticipant $participant = null, ?string $description = null): void
    {
        if ($session->hasExpired()) {
            $this->delete->handle($session);
            throw ValidationException::withMessages(['code' => 'This Transfer Session has expired.']);
        }

        $hours = InstallationSetting::current()->transfer_window_hours;
        $session->update(['last_activity_at' => now(), 'expires_at' => now()->addHours($hours)]);

        if ($description !== null) {
            $session->activities()->create([
                'transfer_participant_id' => $participant?->id,
                'actor' => $participant === null ? 'Dōzobin' : $participant->label,
                'description' => $description,
            ]);
        }
    }
}
