import { router } from '@inertiajs/react';
import type { ConnectionStatus } from 'laravel-echo';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useEffect, useState } from 'react';
import { csrfToken } from '@/lib/api';

/** How often a device re-reads the session while live updates are down. */
const FALLBACK_POLL_MS = 10_000;

let echo: Echo<'reverb'> | null = null;

/**
 * One WebSocket per tab. Reverb sits behind the same origin at /app, so the
 * browser needs only the public app key; host, port and TLS come from the page.
 */
function connect(key: string): Echo<'reverb'> {
    if (echo !== null) {
        return echo;
    }

    const secure = window.location.protocol === 'https:';
    const port = Number(window.location.port) || (secure ? 443 : 80);
    echo = new Echo({
        broadcaster: 'reverb',
        Pusher,
        key,
        wsHost: window.location.hostname,
        wsPort: port,
        wssPort: port,
        forceTLS: secure,
        enabledTransports: ['ws', 'wss'],
        authEndpoint: '/transfers/socket-auth',
        csrfToken: csrfToken(),
    });

    return echo;
}

interface Member {
    id: string;
}

export type LiveStatus = 'live' | 'connecting' | 'offline';

/**
 * Keeps a Transfer Session page in sync with every other device.
 *
 * A push only says "something changed"; the page then reloads the session
 * through the normal authorized request. Presence tells which devices have the
 * session open right now. Without a socket (Reverb off or unreachable) the page
 * falls back to a slow poll, so it still converges.
 */
export function useTransferLive(code: string, realtimeKey: string | null) {
    const [status, setStatus] = useState<LiveStatus>(
        realtimeKey ? 'connecting' : 'offline',
    );
    const [online, setOnline] = useState<ReadonlySet<string>>(new Set());

    useEffect(() => {
        if (realtimeKey === null) {
            return;
        }

        const client = connect(realtimeKey);
        const name = `transfer.${code}`;
        const refresh = () => router.reload({ only: ['transfer'] });
        let wasDown = false;

        const apply = (next: ConnectionStatus) => {
            if (next === 'connected') {
                setStatus('live');

                // Catch up on anything missed while the socket was down.
                if (wasDown) {
                    wasDown = false;
                    refresh();
                }

                return;
            }

            wasDown = true;
            setStatus(
                next === 'connecting' || next === 'reconnecting'
                    ? 'connecting'
                    : 'offline',
            );
        };

        apply(client.connector.connectionStatus());
        const stopWatching = client.connector.onConnectionChange(apply);

        client
            .join(name)
            .here((members: Member[]) =>
                setOnline(new Set(members.map((member) => String(member.id)))),
            )
            .joining((member: Member) =>
                setOnline((current) => new Set(current).add(String(member.id))),
            )
            .leaving((member: Member) =>
                setOnline((current) => {
                    const next = new Set(current);
                    next.delete(String(member.id));

                    return next;
                }),
            )
            .listen('.session.changed', refresh);

        return () => {
            stopWatching();
            client.leave(name);
        };
    }, [code, realtimeKey]);

    useEffect(() => {
        if (status === 'live') {
            return;
        }

        const timer = window.setInterval(
            () => router.reload({ only: ['transfer'] }),
            FALLBACK_POLL_MS,
        );

        return () => window.clearInterval(timer);
    }, [status]);

    return { status, online };
}
