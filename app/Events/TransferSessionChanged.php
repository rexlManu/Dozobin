<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Tells every device in a Transfer Session to reload the session state.
 *
 * The payload carries no content: devices fetch the new state through the
 * normal, authorized page request. A broadcast failure never breaks the
 * request that caused it; devices then catch up through their fallback poll.
 */
final class TransferSessionChanged implements ShouldBroadcastNow, ShouldDispatchAfterCommit, ShouldRescue
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(public readonly string $accessCode) {}

    public static function channelName(string $accessCode): string
    {
        return "transfer.{$accessCode}";
    }

    public function broadcastOn(): PresenceChannel
    {
        return new PresenceChannel(self::channelName($this->accessCode));
    }

    public function broadcastAs(): string
    {
        return 'session.changed';
    }

    /** @return array<string, never> */
    public function broadcastWith(): array
    {
        return [];
    }
}
