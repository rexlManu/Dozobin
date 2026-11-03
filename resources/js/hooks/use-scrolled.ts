import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
    window.addEventListener('scroll', onChange, { passive: true });

    return () => window.removeEventListener('scroll', onChange);
}

/** True once the window has scrolled past `offset` pixels. False on the server. */
export function useScrolled(offset = 8): boolean {
    return useSyncExternalStore(
        subscribe,
        () => window.scrollY > offset,
        () => false,
    );
}
