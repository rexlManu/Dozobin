import { useEffect, useState } from 'react';

/**
 * Ticking clock for countdowns. Kept out of the store so a running timer never
 * re-renders anything that does not display time.
 */
export function useNow(intervalMs = 1000): number {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), intervalMs);

        return () => window.clearInterval(timer);
    }, [intervalMs]);

    return now;
}
