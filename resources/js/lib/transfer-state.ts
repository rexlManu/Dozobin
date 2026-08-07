import type { TransferSession } from '@/lib/types';

export function mergeTransfers(
    live: TransferSession | null,
    history: TransferSession[],
): TransferSession[] {
    if (!live) {
        return history;
    }

    return [live, ...history.filter((session) => session.code !== live.code)];
}

export function transferExpiresAt(
    session: TransferSession,
    windowMs: number,
): number {
    return session.lastActivityAt + windowMs;
}

export function isTransferExpired(
    session: TransferSession,
    windowMs: number,
    now = Date.now(),
): boolean {
    return session.expired || now >= transferExpiresAt(session, windowMs);
}
