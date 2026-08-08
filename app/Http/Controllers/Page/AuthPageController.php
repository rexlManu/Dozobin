<?php

namespace App\Http\Controllers\Page;

use App\Enums\RegistrationMode;
use App\Http\Controllers\Controller;
use App\Models\InstallationSetting;
use App\Services\InviteCodeResolver;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class AuthPageController extends Controller
{
    public function signIn(): Response
    {
        return Inertia::render('auth/signin');
    }

    public function register(Request $request, InviteCodeResolver $invites): Response
    {
        $initialInvite = mb_substr($request->string('invite')->toString(), 0, 255);
        $inviteAvailable = null;

        if ($initialInvite !== '' && InstallationSetting::current()->registration === RegistrationMode::Invite) {
            $inviteAvailable = $invites->findAvailable($initialInvite) !== null
                || $invites->matchesLegacyCode($initialInvite);
        }

        return Inertia::render('auth/register', [
            'initialInvite' => $initialInvite,
            'inviteAvailable' => $inviteAvailable,
        ]);
    }

    public function reset(): Response
    {
        return Inertia::render('auth/reset');
    }
}
