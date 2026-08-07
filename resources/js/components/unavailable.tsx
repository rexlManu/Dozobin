import { CloudSlash, Hourglass, Question } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format';
import { Link } from '@/lib/navigation';

export type UnavailableReason = 'missing' | 'expired' | 'gone';

const COPY: Record<
    UnavailableReason,
    {
        icon: React.ComponentType<{ className?: string }>;
        title: string;
        body: string;
    }
> = {
    missing: {
        icon: Question,
        title: 'Nothing lives at this address',
        body: 'The link may have a typo in it, or the share was deleted by whoever made it. Dōzobin has no search, so there is nothing to look through.',
    },
    expired: {
        icon: Hourglass,
        title: 'This share has expired',
        body: 'Its expiration window ran out and the contents were removed. Ask whoever sent it for a fresh link.',
    },
    gone: {
        icon: CloudSlash,
        title: 'The stored object is missing',
        body: 'The record still exists but the file behind it cannot be read. On a self-hosted installation this usually means the storage volume moved or a cleanup ran too far.',
    },
};

export function Unavailable({
    reason,
    detail,
    expiredAt,
}: {
    reason: UnavailableReason;
    detail?: string;
    expiredAt?: number | null;
}) {
    const { icon: Icon, title, body } = COPY[reason];

    return (
        <div className="mx-auto w-full max-w-[30rem] px-4 py-16 sm:py-24">
            <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-card">
                <Icon className="size-5 text-muted-foreground" />
            </div>
            <h1 className="mt-5 text-xl font-medium tracking-[-0.02em]">
                {title}
            </h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {body}
            </p>

            {detail && (
                <p className="mt-4 rounded-md border border-border bg-sunken px-3 py-2 font-mono text-[11.5px] break-all text-muted-foreground">
                    {detail}
                </p>
            )}
            {expiredAt && (
                <p className="mt-3 font-mono text-[11.5px] text-muted-foreground">
                    Expired {formatDateTime(expiredAt)}
                </p>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild>
                    <Link to="/">Share something yourself</Link>
                </Button>
            </div>
        </div>
    );
}
