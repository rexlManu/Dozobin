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
    onRetry,
    onRemove,
}: {
    item: UploadItem;
    share?: Share;
    expiration: ExpirationKey;
    password: string | null;
    onRetry: (
        id: string,
        expiration: ExpirationKey,
        password: string | null,
    ) => void;
    onRemove: (id: string) => void;
}) {
    const removed = item.status === 'removed';

    return (
        // The divider spans the window; the row's content sits on the rail.
        <li className={cn(removed && 'opacity-55')}>
            <div className="rail grid grid-cols-[auto_1fr_auto] items-start gap-x-3 gap-y-2 py-3.5">
                <div className="mt-0.5 text-muted-foreground">
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
                                'line-through decoration-muted-foreground',
                        )}
                    >
                        {item.filename}
                    </p>
                    <p className="mt-0.5 font-mono text-[11.5px] text-muted-foreground">
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
                        <div className="mt-2 rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2">
                            <p className="text-[12.5px] font-medium text-destructive">
                                {FAILURE_TITLE[item.failure ?? 'network']}
                            </p>
                            <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                                {item.failureNote}
                            </p>
                        </div>
                    )}

                    {item.status === 'done' && share && (
                        <div className="mt-2 flex items-center gap-2">
                            <code className="min-w-0 truncate rounded-md border border-border bg-background px-2 py-1 font-mono text-[11.5px]">
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
                                onRetry(item.id, expiration, password)
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
                            onClick={() => onRemove(item.id)}
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
    queue,
    shares,
    onStart,
    onRetry,
    onRemove,
    onClear,
}: {
    expiration: ExpirationKey;
    password: string | null;
    queue: UploadItem[];
    shares: Share[];
    onStart: (
        id: string,
        expiration: ExpirationKey,
        password: string | null,
    ) => void;
    onRetry: (
        id: string,
        expiration: ExpirationKey,
        password: string | null,
    ) => void;
    onRemove: (id: string) => void;
    onClear: () => void;
}) {
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
        <section className="flex max-h-[55%] min-h-0 shrink-0 animate-in flex-col border-t border-border bg-card duration-300 ease-out slide-in-from-bottom-6">
            <header className="shrink-0 border-b border-border">
                <div className="rail flex flex-wrap items-center gap-3 py-3">
                    <h2 className="text-[13px] font-semibold">
                        {queue.length} {queue.length === 1 ? 'file' : 'files'}
                    </h2>
                    <p className="font-mono text-[11px] text-muted-foreground">
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
                        <Button variant="ghost" size="sm" onClick={onClear}>
                            Clear list
                        </Button>
                        {ready.length > 0 && (
                            <Button
                                size="sm"
                                onClick={() =>
                                    ready.forEach((item) =>
                                        onStart(item.id, expiration, password),
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

            <ul className="min-h-0 flex-1 scrollbar-slim divide-y divide-border overflow-auto">
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
                        onRetry={onRetry}
                        onRemove={onRemove}
                    />
                ))}
            </ul>
        </section>
    );
}
