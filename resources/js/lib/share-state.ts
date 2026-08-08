import type { Share } from '@/lib/types';

export function isShareExpired(share: Share, now: number): boolean {
    return share.expiresAt !== null && share.expiresAt <= now;
}
