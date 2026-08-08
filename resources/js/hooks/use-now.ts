import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { SharedPageProps } from '@/types';

/**
 * Ticking clock for countdowns. Kept out of the store so a running timer never
 * re-renders anything that does not display time.
 */
export function useNow(intervalMs = 1000): number {
    const initialNow = usePage<SharedPageProps>().props.serverNow;
    const [now, setNow] = useState(initialNow);

    useEffect(() => {
        const update = () => setNow(Date.now());
        update();

        const timer = window.setInterval(update, intervalMs);

        return () => window.clearInterval(timer);
    }, [intervalMs]);

    return now;
}
