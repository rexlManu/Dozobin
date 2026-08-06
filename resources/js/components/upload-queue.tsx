import {
    ArrowClockwise,
    ArrowSquareOut,
    CheckCircle,
    Prohibit,
    Trash,
    WarningCircle,
    X,
} from '@phosphor-icons/react';
import { CopyButton } from '@/components/copy-button';
import { FileGlyph } from '@/components/file-glyph';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { mimeLabel } from '@/lib/detect';
import { formatBytes, shareUrl } from '@/lib/format';
import { Link } from '@/lib/navigation';
import type { ExpirationKey, Share, UploadItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useDozo } from '@/store/store';

const FAILURE_TITLE: Record<NonNullable<UploadItem['failure']>, string> = {
    type: 'File type not accepted',
    size: 'File is over the upload limit',
    quota: 'Storage limit reached',
    network: 'Upload interrupted',
};

function StatusChip({ item }: { item: UploadItem }) {
    const base =
        'inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em]';

    switch (item.status) {
        case 'queued':
            return (
                <span className={cn(base, 'text-muted-foreground')}>Ready</span>
            );
        case 'uploading':
            return (
                <span className={cn(base, 'text-foreground')}>
                    {String(item.progress).padStart(2, '0')}%
                </span>
            );
        case 'done':
            return (
                <span className={cn(base, 'text-primary')}>
                    <CheckCircle weight="fill" className="size-3.5" /> Done
                </span>
            );
        case 'failed':
            return (
                <span className={cn(base, 'text-destructive')}>
                    <WarningCircle weight="fill" className="size-3.5" /> Failed
                </span>
            );
        case 'removed':
            return (
                <span className={cn(base, 'text-muted-foreground')}>
                    <Prohibit className="size-3.5" /> Removed
                </span>
            );
    }
}

function UploadRow({
    item,
    share,
    expiration,
    password,
}: {
    item: UploadItem;
    share?: Share;
    expiration: ExpirationKey;
    password: string | null;
}) {
    const retryUpload = useDozo((s) => s.retryUpload);
    const removeUpload = useDozo((s) => s.removeUpload);
    const removed = item.status === 'removed';

    return (
        // The divider spans the window; the row's content sits on the rail.
        <li className={cn(removed && 'opacity-55')}>
            <div className="rail grid grid-cols-[auto_1fr_auto] items-start gap-x-3 gap-y-2 py-3.5">
                <div className="text-muted-foreground mt-0.5">
                    <FileGlyph
                        mime={item.mime}
                        filename={item.filename}
                        className="size-[18px]"
                    />
                </div>

                <div className="min-w-0">
                    <p
                        className={cn(
                            'truncate text-[13.5px] font-medium',
                            removed &&
                                'decoration-muted-foreground line-through',
                        )}
                    >
                        {item.filename}
                    </p>
                    <p className="text-muted-foreground mt-0.5 font-mono text-[11.5px]">
                        {formatBytes(item.size)} ·{' '}
                        {mimeLabel(item.mime, item.filename)}
                    </p>

                    {item.status === 'uploading' && (
                        <Progress
                            value={item.progress}
                            className="mt-2.5 h-1 max-w-md"
                        />
                    )}

                    {item.status === 'failed' && (
                        <div className="border-destructive/30 bg-destructive-soft mt-2 rounded-md border px-3 py-2">
                            <p className="text-destructive text-[12.5px] font-medium">
                                {FAILURE_TITLE[item.failure ?? 'network']}
                            </p>
                            <p className="text-muted-foreground mt-0.5 text-[12px] leading-relaxed">
                                {item.failureNote}
                            </p>
                        </div>
                    )}

                    {item.status === 'done' && share && (
                        <div className="mt-2 flex items-center gap-2">
                            <code className="border-border bg-background min-w-0 truncate rounded-md border px-2 py-1 font-mono text-[11.5px]">
                                {shareUrl(share)}
                            </code>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 justify-self-end">
                    <StatusChip item={item} />
                    {item.status === 'done' && share && (
                        <>
                            <CopyButton
                                value={shareUrl(share)}
                                size="icon-sm"
                                variant="ghost"
                                label="Copy link"
                            />
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                asChild
                                aria-label="Open share"
                            >
                                <Link to={`/s/${share.id}`}>
                                    <ArrowSquareOut />
                                </Link>
                            </Button>
                        </>
                    )}
                    {item.status === 'failed' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                retryUpload(item.id, expiration, password)
                            }
                        >
                            <ArrowClockwise /> Retry
                        </Button>
                    )}
                    {(item.status === 'queued' || item.status === 'failed') && (
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove ${item.filename}`}
                            onClick={() => removeUpload(item.id)}
                        >
                            {item.status === 'failed' ? <Trash /> : <X />}
                        </Button>
                    )}
                </div>
            </div>
        </li>
    );
}

export function UploadQueue({
    expiration,
    password,
}: {
    expiration: ExpirationKey;
    password: string | null;
}) {
    const queue = useDozo((s) => s.queue);
    const shares = useDozo((s) => s.shares);
    const startUpload = useDozo((s) => s.startUpload);
    const clearQueue = useDozo((s) => s.clearQueue);

    if (queue.length === 0) {
        return null;
    }

    const ready = queue.filter((i) => i.status === 'queued');
    const done = queue.filter((i) => i.status === 'done');
    const failed = queue.filter((i) => i.status === 'failed');
    const uploading = queue.filter((i) => i.status === 'uploading');

    const summary = [
        done.length > 0 ? `${done.length} finished` : null,
        uploading.length > 0 ? `${uploading.length} uploading` : null,
        failed.length > 0 ? `${failed.length} failed` : null,
        ready.length > 0 ? `${ready.length} waiting` : null,
    ].filter(Boolean);

    return (
        // A tray that rises over the canvas rather than a card on a page. The drop
        // target stays live behind and around it, so more files can still land.
        <section className="animate-in border-border bg-card slide-in-from-bottom-6 flex max-h-[55%] min-h-0 shrink-0 flex-col border-t duration-300 ease-out">
            <header className="border-border shrink-0 border-b">
                <div className="rail flex flex-wrap items-center gap-3 py-3">
                    <h2 className="text-[13px] font-semibold">
                        {queue.length} {queue.length === 1 ? 'file' : 'files'}
                    </h2>
                    <p className="text-muted-foreground font-mono text-[11px]">
                        {summary.join(' · ')}
                    </p>
                    <div className="ml-auto flex items-center gap-2">
                        {done.length > 1 && (
                            <CopyButton
                                variant="ghost"
                                size="sm"
                                label={`Copy ${done.length} links`}
                                copiedLabel="Links copied"
                                value={done
                                    .map((item) =>
                                        shares.find(
                                            (s) => s.id === item.shareId,
                                        ),
                                    )
                                    .filter((s): s is Share => Boolean(s))
                                    .map((s) => shareUrl(s))
                                    .join('\n')}
                            />
                        )}
                        <Button variant="ghost" size="sm" onClick={clearQueue}>
                            Clear list
                        </Button>
                        {ready.length > 0 && (
                            <Button
                                size="sm"
                                onClick={() =>
                                    ready.forEach((item) =>
                                        startUpload(
                                            item.id,
                                            expiration,
                                            password,
                                        ),
                                    )
                                }
                            >
                                Upload {ready.length}{' '}
                                {ready.length === 1 ? 'file' : 'files'}
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <ul className="divide-border scrollbar-slim min-h-0 flex-1 divide-y overflow-auto">
                {queue.map((item) => (
                    <UploadRow
                        key={item.id}
                        item={item}
                        share={
                            item.shareId
                                ? shares.find((s) => s.id === item.shareId)
                                : undefined
                        }
                        expiration={expiration}
                        password={password}
                    />
                ))}
            </ul>
        </section>
    );
}
