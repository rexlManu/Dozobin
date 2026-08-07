import type { Share } from '@/lib/types';

export function isShareExpired(share: Share, now = Date.now()): boolean {
    return share.expiresAt !== null && share.expiresAt <= now;
}
