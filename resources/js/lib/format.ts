import type { ExpirationKey } from './types';

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export const EXPIRATION_MS: Record<ExpirationKey, number | null> = {
    '1h': HOUR,
    '1d': DAY,
    '7d': 7 * DAY,
    '30d': 30 * DAY,
    never: null,
};

export const EXPIRATION_LABEL: Record<ExpirationKey, string> = {
    '1h': '1 hour',
    '1d': '1 day',
    '7d': '7 days',
    '30d': '30 days',
    never: 'Never',
};

export const EXPIRATION_ORDER: ExpirationKey[] = [
    '1h',
    '1d',
    '7d',
    '30d',
    'never',
];

export function expiresAtFrom(
    key: ExpirationKey,
    from = Date.now(),
): number | null {
    const ms = EXPIRATION_MS[key];

    return ms === null ? null : from + ms;
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = bytes / 1024;
    let unit = 0;

    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }

    return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

/** "in 3 days" / "4 minutes ago" without pulling in a date library. */
export function relativeTime(target: number, now = Date.now()): string {
    const diff = target - now;
    const abs = Math.abs(diff);
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const steps: [number, Intl.RelativeTimeFormatUnit][] = [
        [DAY * 365, 'year'],
        [DAY * 30, 'month'],
        [DAY * 7, 'week'],
        [DAY, 'day'],
        [HOUR, 'hour'],
        [MINUTE, 'minute'],
    ];

    for (const [ms, unit] of steps) {
        if (abs >= ms) {
            return rtf.format(Math.round(diff / ms), unit);
        }
    }

    return rtf.format(Math.round(diff / 1000), 'second');
}

export function formatDateTime(at: number): string {
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(at);
}

/** Fixed-width countdown, e.g. "11:58:04" or "3d 04:11". */
export function countdown(target: number, now = Date.now()): string {
    const left = Math.max(0, target - now);
    const days = Math.floor(left / DAY);
    const hours = Math.floor((left % DAY) / HOUR);
    const minutes = Math.floor((left % HOUR) / MINUTE);
    const seconds = Math.floor((left % MINUTE) / 1000);
    const pad = (n: number) => String(n).padStart(2, '0');

    if (days > 0) {
        return `${days}d ${pad(hours)}:${pad(minutes)}`;
    }

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function isExpiringSoon(
    expiresAt: number | null,
    now = Date.now(),
): boolean {
    if (expiresAt === null) {
        return false;
    }

    return expiresAt - now < 2 * HOUR;
}

export function fileExtension(filename: string): string {
    const dot = filename.lastIndexOf('.');

    return dot === -1 ? '' : filename.slice(dot + 1).toLowerCase();
}

const SLUG_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomFrom(alphabet: string, length: number): string {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    let out = '';

    for (const byte of bytes) {
        out += alphabet[byte % alphabet.length];
    }

    return out;
}

/** Unguessable share slug, in the spirit of "holding the URL is the permission". */
export function makeSlug(): string {
    return randomFrom(SLUG_ALPHABET, 10);
}

/** Eight-character alphanumeric Transfer Session Access Code. */
export function makeAccessCode(): string {
    return randomFrom(CODE_ALPHABET, 8);
}

export function makeId(prefix: string): string {
    return `${prefix}_${randomFrom(SLUG_ALPHABET, 8)}`;
}

export function shareUrl(share: {
    kind: 'file' | 'paste';
    id: string;
}): string {
    const path = share.kind === 'file' ? 's' : 'p';
    const origin =
        typeof window === 'undefined'
            ? 'https://dozobin.example'
            : window.location.origin;

    return `${origin}/${path}/${share.id}`;
}
