import { cn } from '@/lib/utils';

/**
 * The Long night sky, fixed to the window behind the whole page. It is a
 * still image (`.night-sky` in app.css), so it costs no work after loading.
 * Put it first inside a `relative isolate` page frame.
 */
export function NightSky() {
    return (
        <div
            aria-hidden
            className="night-sky pointer-events-none fixed inset-x-0 top-0 -z-10 h-lvh"
        />
    );
}

/**
 * The city that ends every page, 220px on a phone and 260px from `sm`. Put
 * it last in the page frame, in flow, so content never covers it.
 */
export function NightCity() {
    return (
        <div
            aria-hidden
            className="night-city pointer-events-none h-[220px] shrink-0 sm:h-[260px]"
        />
    );
}

/** The four-point sparkle that marks a device as online. */
export function Sparkle({ className }: { className?: string }) {
    return (
        <svg
            aria-hidden
            viewBox="-12 -12 24 24"
            className={cn('size-3.5 shrink-0', className)}
        >
            <path
                d="M0 -10q2 8 10 10q-8 2-10 10q-2-8-10-10q8-2 10-10z"
                fill="#fff4d2"
            />
        </svg>
    );
}
