<?php

namespace App\Actions\Transfers;

use App\Models\TransferSession;
use Illuminate\Http\Request;

final class FindCurrentTransferSessionAction
{
    public function handle(Request $request): ?TransferSession
    {
        $browserId = $request->session()->get('transfer_browser_id');

        if (! is_string($browserId)) {
            return null;
        }

        return TransferSession::query()
            ->whereHas('participants', fn ($query) => $query
                ->where('browser_id', $browserId)
                ->whereNull('left_at'))
            ->whereNull('expired_at')
            ->where('expires_at', '>', now())
            ->with(['items.participant', 'participants', 'activities'])
            ->latest('last_activity_at')
            ->first();
    }
}
