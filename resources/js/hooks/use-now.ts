import { useEffect, useState } from 'react';

/**
 * Ticking clock for countdowns. Kept out of the store so a running timer never
 * re-renders anything that does not display time.
 */
export function useNow(intervalMs = 1000): number | null {
    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        const update = () => setNow(Date.now());
        update();

        const timer = window.setInterval(update, intervalMs);

        return () => window.clearInterval(timer);
    }, [intervalMs]);

    return now;
}
