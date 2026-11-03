import { expect, it } from 'vitest';
import { MINUTE, initials, relativeTime } from '@/lib/format';

it('builds avatar initials from the first and last name', () => {
    expect(initials('Ines Mori')).toBe('IM');
    expect(initials('  ruben  de  Ishikawa ')).toBe('RI');
    expect(initials('Ruben')).toBe('R');
    expect(initials('')).toBe('');
});

it('reads times within a few seconds as just now, in both directions', () => {
    const now = 1_800_000_000_000;

    expect(relativeTime(now + 3_000, now)).toBe('just now');
    expect(relativeTime(now - 20_000, now)).toBe('just now');
    expect(relativeTime(now - 5 * MINUTE, now)).toBe('5 minutes ago');
});
