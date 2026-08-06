<?php

namespace App\Actions\Transfers;

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

        $user = $request->user();
        $participant = $session->participants()->firstOrCreate(
            ['browser_id' => $browserId],
            [
                'label' => $user instanceof User ? $user->name : 'This device',
                'device' => str_contains((string) $request->userAgent(), 'Mobile') ? 'Phone' : 'Browser',
                'joined_at' => now(),
            ],
        );

        if ($participant->left_at !== null) {
            $participant->update(['left_at' => null, 'joined_at' => now()]);
        }

        return $participant;
    }
}
