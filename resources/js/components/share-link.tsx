import { ArrowSquareOut, Lock } from '@phosphor-icons/react';
import { CopyButton } from '@/components/copy-button';
import { ExpiryLabel } from '@/components/expiry';
import { Button } from '@/components/ui/button';
import { shareUrl } from '@/lib/format';
import { Link } from '@/lib/navigation';
import type { Share } from '@/lib/types';
import { cn } from '@/lib/utils';

export function ShareLink({
    share,
    className,
}: {
    share: Share;
    className?: string;
}) {
    const url = shareUrl(share);
    const path = `${share.kind === 'file' ? '/s/' : '/p/'}${share.id}`;

    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <div className="flex items-stretch gap-2">
                <div className="flex min-w-0 flex-1 items-center rounded-md border border-border bg-background px-3">
                    <span className="truncate font-mono text-[12.5px] text-foreground">
                        {url}
                    </span>
                </div>
                <CopyButton value={url} size="default" />
                <Button
                    variant="outline"
                    size="icon"
                    asChild
                    aria-label="Open share"
                >
                    <Link to={path}>
                        <ArrowSquareOut />
                    </Link>
                </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
                <ExpiryLabel expiresAt={share.expiresAt} />
                {share.password && (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Lock className="size-3.5" /> Password required
                    </span>
                )}
                {share.ownerId === null && (
                    <span className="text-muted-foreground">
                        Created as a Guest, so it is not in any Library
                    </span>
                )}
            </div>
        </div>
    );
}
