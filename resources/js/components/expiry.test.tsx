/** @vitest-environment jsdom */

import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { Countdown } from '@/components/expiry';

const clock = vi.hoisted(() => ({ serverNow: 1_786_180_000_000 }));

vi.mock('@inertiajs/react', () => ({
    usePage: () => ({ props: { serverNow: clock.serverNow } }),
}));

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

it('hydrates a server countdown before advancing to the client clock', async () => {
    const target = clock.serverNow + 60_000;
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Countdown target={target} />);

    expect(container.textContent).toBe('00:01:00');

    vi.useFakeTimers({ now: clock.serverNow + 5_000 });
    const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
    let root: ReturnType<typeof hydrateRoot> | undefined;

    await act(async () => {
        root = hydrateRoot(container, <Countdown target={target} />);
    });

    expect(
        consoleError.mock.calls.some(([message]) =>
            String(message).includes('Hydration failed'),
        ),
    ).toBe(false);
    expect(container.textContent).toBe('00:00:55');

    await act(async () => root?.unmount());
});
