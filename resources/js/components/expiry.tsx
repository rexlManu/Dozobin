import {
    Infinity as InfinityIcon,
    Hourglass,
    Prohibit,
} from '@phosphor-icons/react';
import { useNow } from '@/hooks/use-now';
import { countdown, isExpiringSoon, relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Reads "Expires in 3 days", "Expires in 00:41:12" when close, or "No expiry". */
export function ExpiryLabel({
    expiresAt,
    className,
    prefix = 'Expires',
}: {
    expiresAt: number | null;
    className?: string;
    prefix?: string;
}) {
    const now = useNow(1000);
    const soon = isExpiringSoon(expiresAt, now);

    if (expiresAt === null) {
        return (
            <span
                className={cn(
                    'inline-flex items-center gap-1.5 text-muted-foreground',
                    className,
                )}
            >
                <InfinityIcon className="size-3.5" />
                <span>No expiry</span>
            </span>
        );
    }

    if (expiresAt <= now) {
        return (
            <span
                className={cn(
                    'inline-flex items-center gap-1.5 text-destructive',
                    className,
                )}
            >
                <Prohibit className="size-3.5" />
                <span>Expired {relativeTime(expiresAt, now)}</span>
            </span>
        );
    }

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5',
                soon ? 'text-warn' : 'text-muted-foreground',
                className,
            )}
        >
            <Hourglass
                className="size-3.5"
                weight={soon ? 'fill' : 'regular'}
            />
            <span>
                {prefix}{' '}
                <span className="font-mono">
                    {soon
                        ? `in ${countdown(expiresAt, now)}`
                        : relativeTime(expiresAt, now)}
                </span>
            </span>
        </span>
    );
}

/** Big fixed-width clock for the Transfer Session header. */
export function Countdown({
    target,
    className,
}: {
    target: number;
    className?: string;
}) {
    const now = useNow(1000);
    const left = target - now;
    const urgent = left < 60 * 60 * 1000;

    return (
        <span
            className={cn(
                'font-mono tabular-nums',
                urgent ? 'text-destructive' : 'text-foreground',
                className,
            )}
        >
            {countdown(target, now)}
        </span>
    );
}
