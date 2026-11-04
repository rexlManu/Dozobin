<?php

namespace App\Http\Controllers;

use App\Events\TransferSessionChanged;
use App\Http\Requests\AuthorizeTransferSocketRequest;
use App\Models\TransferSession;
use Illuminate\Broadcasting\Broadcasters\PusherBroadcaster;
use Illuminate\Broadcasting\BroadcastManager;
use Illuminate\Http\Response;

/**
 * Authorizes a device for its Transfer Session presence channel.
 *
 * Participants are browsers, not accounts, so this replaces Laravel's user-based
 * /broadcasting/auth. Only a device that joined and has not left may subscribe.
 */
final class TransferSocketController extends Controller
{
    public function __invoke(AuthorizeTransferSocketRequest $request, BroadcastManager $broadcast): Response
    {
        $broadcaster = $broadcast->connection();
        abort_unless($broadcaster instanceof PusherBroadcaster, 404);

        $session = TransferSession::query()->where('access_code', $request->accessCode())->first();
        abort_if($session === null || $session->hasExpired(), 403);

        $participant = $session->activeParticipant($request->session()->get('transfer_browser_id'));
        abort_if($participant === null, 403);

        $auth = $broadcaster->getPusher()->authorizePresenceChannel(
            'presence-'.TransferSessionChanged::channelName($session->access_code),
            $request->string('socket_id')->toString(),
            (string) $participant->id,
            // Echo passes only this info to presence callbacks, so it carries the id too.
            ['id' => (string) $participant->id, 'label' => $participant->label, 'device' => $participant->device],
        );

        return response($auth, 200, ['Content-Type' => 'application/json']);
    }
}
