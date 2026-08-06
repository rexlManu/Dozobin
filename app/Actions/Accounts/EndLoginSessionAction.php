<?php

namespace App\Actions\Accounts;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class EndLoginSessionAction
{
    public function handle(Request $request, User $user, string $sessionId): void
    {
        if (hash_equals($request->session()->getId(), $sessionId)) {
            throw ValidationException::withMessages([
                'session' => 'The current session cannot be ended here.',
            ]);
        }

        DB::table(config('session.table', 'sessions'))
            ->where('id', $sessionId)
            ->where('user_id', $user->id)
            ->delete();
    }
}
