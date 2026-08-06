import { useEffect } from 'react';
import { useDozo } from '@/store/store';

/**
 * System mode follows the OS query live, so switching the OS theme moves the
 * app without a reload.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const appearance = useDozo((s) => s.appearance);

    useEffect(() => {
        const root = document.documentElement;
        const query = window.matchMedia('(prefers-color-scheme: dark)');

        const apply = () => {
            const dark =
                appearance === 'dark' ||
                (appearance === 'system' && query.matches);
            root.classList.toggle('dark', dark);
            root.style.colorScheme = dark ? 'dark' : 'light';
        };

        apply();

        if (appearance !== 'system') {
            return;
        }

        query.addEventListener('change', apply);

        return () => query.removeEventListener('change', apply);
    }, [appearance]);

    return children;
}
