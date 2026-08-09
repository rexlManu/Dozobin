import { expect, it } from 'vitest';
import { formatPageTitle } from '@/lib/app-title';

it('uses the runtime application name in page titles', () => {
    expect(
        formatPageTitle('Drop', {
            props: { name: 'Dōzobin' },
        }),
    ).toBe('Drop - Dōzobin');

    expect(
        formatPageTitle('Library', {
            props: { name: 'Private Cloud' },
        }),
    ).toBe('Library - Private Cloud');

    expect(formatPageTitle('', { props: {} })).toBe('Dōzobin');
});
