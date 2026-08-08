<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\CreateInviteCodeAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInviteCodeRequest;
use App\Models\InviteCode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class InviteCodeController extends Controller
{
    public function store(StoreInviteCodeRequest $request, CreateInviteCodeAction $create): RedirectResponse
    {
        $create->handle($request->user(), [
            'name' => $request->string('name')->toString(),
            'max_uses' => $request->filled('max_uses') ? $request->integer('max_uses') : null,
            'expires_at' => $request->filled('expires_at') ? $request->string('expires_at')->toString() : null,
        ]);

        return back()->with('status', 'Invite code created.');
    }

    public function destroy(Request $request, InviteCode $inviteCode): RedirectResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        if ($inviteCode->revoked_at === null) {
            $inviteCode->update(['revoked_at' => now()]);
        }

        return back()->with('status', 'Invite code revoked.');
    }
}
