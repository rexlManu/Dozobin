import { cn } from '@/lib/utils';

/**
 * Two squares, one handing off to the other. Kept to two primitives on purpose:
 * it has to survive being 16px in a browser tab.
 */
export function Mark({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden
            className={cn('size-6', className)}
        >
            <rect
                x="1.25"
                y="1.25"
                width="15.5"
                height="15.5"
                rx="3.25"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                opacity="0.62"
            />
            <rect
                x="8"
                y="8"
                width="14.75"
                height="14.75"
                rx="3.25"
                className="fill-primary"
            />
        </svg>
    );
}

export function Wordmark({ className }: { className?: string }) {
    return (
        <span className={cn('flex items-center gap-2', className)}>
            <Mark className="size-[22px]" />
            <span className="text-[15px] font-semibold tracking-[-0.015em]">
                Dōzobin
            </span>
        </span>
    );
}
