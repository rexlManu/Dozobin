<?php

namespace App\Actions\Transfers;

use App\Data\DeviceDescription;
use App\Models\TransferParticipant;
use App\Models\TransferSession;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

final class ResolveTransferParticipantAction
{
    public function handle(Request $request, TransferSession $session): TransferParticipant
    {
        $browserId = $request->session()->get('transfer_browser_id');
        if (! is_string($browserId)) {
            $browserId = (string) Str::uuid();
            $request->session()->put('transfer_browser_id', $browserId);
        }

        $participant = $session->participants()->where('browser_id', $browserId)->first();

        if ($participant === null) {
            $device = DeviceDescription::fromUserAgent($request->userAgent());

            return $session->participants()->create([
                'browser_id' => $browserId,
                'label' => $this->uniqueLabel($session, $this->label($request->user(), $device)),
                'device' => $device->isPhone ? 'Phone' : 'Browser',
                'joined_at' => now(),
            ]);
        }

        if ($participant->left_at !== null) {
            $participant->update(['left_at' => null, 'joined_at' => now()]);
        }

        return $participant;
    }

    /** "Mika's iPhone" for a Member, "iPhone · Safari" for a Guest. */
    private function label(mixed $user, DeviceDescription $device): string
    {
        if (! $user instanceof User) {
            return $device->label();
        }

        $firstName = Str::before(trim($user->name), ' ');
        $platform = $device->platform === 'Browser' ? 'browser' : $device->platform;

        return "{$firstName}'s {$platform}";
    }

    /** Two identical devices in one session get "2", "3" so every device stays distinct. */
    private function uniqueLabel(TransferSession $session, string $label): string
    {
        $taken = $session->participants()->pluck('label')->all();
        $candidate = $label;

        for ($number = 2; in_array($candidate, $taken, true); $number++) {
            $candidate = "{$label} {$number}";
        }

        return $candidate;
    }
}
