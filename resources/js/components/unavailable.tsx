import type { DozoMood } from '@/components/dozo';
import { StateNote } from '@/components/state-note';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format';
import { Link } from '@/lib/navigation';

export type UnavailableReason = 'missing' | 'expired' | 'gone' | 'blocked';

const COPY: Record<
    UnavailableReason,
    { mood: DozoMood; title: string; body: string }
> = {
    missing: {
        mood: 'wow',
        title: 'Nothing lives at this address',
        body: 'The link may have a typo, or the person who made it deleted it.',
    },
    expired: {
        mood: 'sleep',
        title: 'This share has expired',
        body: 'Its time ran out and the contents were removed. Ask the sender for a new link.',
    },
    gone: {
        mood: 'wow',
        title: 'The file is missing',
        body: 'The share still exists, but its file cannot be read. The administrator of this installation can check the storage.',
    },
    blocked: {
        mood: 'wow',
        title: 'Removed after a security scan',
        body: 'A malware scan found a threat in this file, so it was removed. Ask the sender for a different file.',
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
    const { mood, title, body } = COPY[reason];

    return (
        <StateNote mood={mood} title={title}>
            <p className="text-muted-foreground">{body}</p>
            {detail && (
                <p className="w-full rounded-[14px] bg-sunken px-3.5 py-2 font-mono text-[13px] break-all text-muted-foreground">
                    {detail}
                </p>
            )}
            {expiredAt && (
                <p className="text-[13px] text-muted-foreground">
                    Expired {formatDateTime(expiredAt)}
                </p>
            )}
            <Button asChild className="mt-1">
                <Link to="/">Send something yourself</Link>
            </Button>
        </StateNote>
    );
}
