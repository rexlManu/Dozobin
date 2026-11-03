import { useSyncExternalStore } from 'react';

const noSubscription = () => () => {};

/**
 * The page origin, e.g. "https://dozobin.test". The server render and the first
 * browser frame use the fallback, so hydration matches; React then switches to
 * the real origin.
 */
export function useOrigin(fallback = 'https://dozobin.example'): string {
    return useSyncExternalStore(
        noSubscription,
        () => window.location.origin,
        () => fallback,
    );
}
