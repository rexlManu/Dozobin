import { useEffect, useRef } from 'react';
import { Link } from '@/lib/navigation';
import { cn } from '@/lib/utils';

/** True when `path` is `prefix` itself or a page below it. */
export function isUnder(path: string, prefix: string): boolean {
    return path === prefix || path.startsWith(`${prefix}/`);
}

/**
 * A row of pills that scrolls sideways when it does not fit, with the active
 * pill scrolled into view on load so a phone shows where you are.
 */
export function PillNav({
    label,
    items,
    path,
    track = false,
}: {
    label: string;
    items: { to: string; match?: string; label: string }[];
    path: string;
    /** Draw the row as a segment track, for the settings tabs under the main pills. */
    track?: boolean;
}) {
    const row = useRef<HTMLElement>(null);

    useEffect(() => {
        const element = row.current;
        const active = element?.querySelector('[aria-current="page"]');

        if (!element || !active || element.scrollWidth <= element.clientWidth) {
            return;
        }

        const box = active.getBoundingClientRect();
        const frame = element.getBoundingClientRect();
        element.scrollLeft += box.left - frame.left - 16;
    }, []);

    return (
        <nav
            ref={row}
            aria-label={label}
            className="-mx-4 scrollbar-slim overflow-x-auto px-4 sm:mx-0 sm:px-0"
        >
            <div
                className={cn(
                    'flex w-max gap-1',
                    track && 'rounded-[16px] bg-sunken p-1',
                )}
            >
                {items.map((item) => {
                    const active = isUnder(path, item.match ?? item.to);

                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'shrink-0 font-bold whitespace-nowrap transition-colors',
                                track
                                    ? 'rounded-[12px] px-3.5 py-1.5 text-[14px]'
                                    : 'rounded-[14px] px-3.5 py-2 text-[15px]',
                                active
                                    ? track
                                        ? 'bg-lavender text-night'
                                        : 'bg-foreground text-night'
                                    : 'text-muted-foreground hover:text-foreground',
                                !active && !track && 'hover:bg-sunken',
                            )}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
