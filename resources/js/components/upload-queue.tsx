import {
    ArrowClockwise,
    ArrowSquareOut,
    Check,
    Trash,
    X,
} from '@phosphor-icons/react';
import { CopyButton } from '@/components/copy-button';
import { FileGlyph } from '@/components/file-glyph';
import { Button } from '@/components/ui/button';
import { formatBytes, shareUrl } from '@/lib/format';
import { Link } from '@/lib/navigation';
import type { ExpirationKey, Share, UploadItem } from '@/lib/types';
import { cn } from '@/lib/utils';

const FAILURE_TITLE: Record<NonNullable<UploadItem['failure']>, string> = {
    type: 'This file type is not allowed here',
    size: 'Larger than the upload limit',
    quota: 'Your storage is full',
    network: 'The upload was interrupted',
};

/** Blob color and tag per state, so each row says where it stands at a glance. */
const TONE: Record<UploadItem['status'], { blob: string; tag: string }> = {
    queued: {
        blob: 'bg-sunken text-muted-foreground',
        tag: 'text-muted-foreground',
    },
    uploading: { blob: 'bg-lavender text-night', tag: 'text-lavender' },
    done: { blob: 'bg-mint text-night', tag: 'bg-mint-soft text-mint' },
    failed: {
        blob: 'bg-primary text-primary-foreground',
        tag: 'bg-primary-soft text-primary',
    },
    removed: {
        blob: 'bg-sunken text-muted-foreground',
        tag: 'text-muted-foreground',
    },
};

function StatusTag({ item }: { item: UploadItem }) {
    const label = {
        queued: 'Waiting',
        uploading: `${item.progress}%`,
        done: 'Delivered',
        failed: 'Not sent',
        removed: 'Removed',
    }[item.status];

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-[10px] px-2.5 py-1 text-[13px] font-bold tabular-nums',
                TONE[item.status].tag,
            )}
        >
            {item.status === 'done' && (
                <Check weight="bold" className="size-3.5" />
            )}
            {label}
        </span>
    );
}

function UploadRow({
    item,
    share,
    retryDisabled,
    onRetry,
    onRemove,
}: {
    item: UploadItem;
    share?: Share;
    retryDisabled: boolean;
    onRetry: () => void;
    onRemove: () => void;
}) {
    const url = item.status === 'done' && share ? shareUrl(share) : null;

    return (
        <li
            className={cn(
                'dz-pop grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-2 rounded-[20px] bg-card px-3.5 py-3 sm:grid-cols-[44px_minmax(0,1fr)_auto_auto]',
                item.status === 'removed' && 'opacity-50',
            )}
        >
            <span
                className={cn(
                    'grid size-11 place-items-center rounded-[16px_18px_14px_20px]',
                    TONE[item.status].blob,
                )}
            >
                <FileGlyph
                    mime={item.mime}
                    filename={item.filename}
                    className="size-5"
                />
            </span>

            <div className="grid min-w-0 gap-0.5">
                <p
                    className={cn(
                        'truncate font-bold',
                        item.status === 'removed' && 'line-through',
                    )}
                >
                    {item.filename}
                </p>
                <p className="truncate text-[13px] text-muted-foreground">
                    {item.status === 'failed' ? (
                        <span className="text-primary">
                            {FAILURE_TITLE[item.failure ?? 'network']}
                            {item.failureNote ? `. ${item.failureNote}` : ''}
                        </span>
                    ) : (
                        <>
                            {formatBytes(item.size)}
                            {url && (
                                <>
                                    {' · '}
                                    <span className="font-mono text-[12px] text-[#d9d0ff]">
                                        {url.replace(/^https?:\/\//, '')}
                                    </span>
                                </>
                            )}
                        </>
                    )}
                </p>
                {item.status === 'uploading' && (
                    <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-sunken">
                        <span
                            className="block h-full rounded-full bg-linear-to-r from-lavender to-primary transition-[width] duration-200"
                            style={{ width: `${item.progress}%` }}
                        />
                    </span>
                )}
            </div>

            <StatusTag item={item} />

            <div className="col-span-2 col-start-2 flex items-center gap-1.5 sm:col-span-1 sm:col-start-auto sm:justify-self-end">
                {url && share && (
                    <>
                        <CopyButton value={url} size="sm" label="Copy link" />
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
                        disabled={retryDisabled}
                        onClick={onRetry}
                    >
                        <ArrowClockwise /> Try again
                    </Button>
                )}
                {(item.status === 'queued' || item.status === 'failed') && (
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${item.filename}`}
                        onClick={onRemove}
                    >
                        {item.status === 'failed' ? <Trash /> : <X />}
                    </Button>
                )}
            </div>
        </li>
    );
}

/** The results of this batch: one row per file, newest first. */
export function UploadQueue({
    expiration,
    password,
    waitingForPassword,
    queue,
    shares,
    onStart,
    onRetry,
    onRemove,
    onClear,
}: {
    expiration: ExpirationKey;
    password: string | null;
    /** A password is switched on but empty: sending now would skip it. */
    waitingForPassword: boolean;
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

    const ready = queue.filter((item) => item.status === 'queued');
    const done = queue.filter((item) => item.status === 'done');
    const links = done
        .map((item) => shares.find((share) => share.id === item.shareId))
        .filter((share): share is Share => share !== undefined)
        .map((share) => shareUrl(share));

    return (
        <section aria-label="This batch" className="mt-8">
            <header className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 className="text-[22px] font-bold">
                    {done.length > 0
                        ? `${done.length} delivered`
                        : 'On the way'}
                </h2>
                <span className="text-[13px] text-muted-foreground">
                    {queue.length} in this batch
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                    {links.length > 1 && (
                        <CopyButton
                            variant="ghost"
                            size="sm"
                            label={`Copy ${links.length} links`}
                            copiedLabel="Links copied"
                            value={links.join('\n')}
                        />
                    )}
                    <Button variant="ghost" size="sm" onClick={onClear}>
                        Clear list
                    </Button>
                    {ready.length > 0 && (
                        <Button
                            size="sm"
                            disabled={waitingForPassword}
                            title={
                                waitingForPassword
                                    ? 'Type the password first'
                                    : undefined
                            }
                            onClick={() =>
                                ready.forEach((item) =>
                                    onStart(item.id, expiration, password),
                                )
                            }
                        >
                            Send {ready.length}{' '}
                            {ready.length === 1 ? 'file' : 'files'}
                        </Button>
                    )}
                </div>
            </header>

            <ul className="grid gap-2" aria-live="polite">
                {[...queue].reverse().map((item) => (
                    <UploadRow
                        key={item.id}
                        item={item}
                        share={
                            item.shareId
                                ? shares.find(
                                      (share) => share.id === item.shareId,
                                  )
                                : undefined
                        }
                        retryDisabled={waitingForPassword}
                        onRetry={() => onRetry(item.id, expiration, password)}
                        onRemove={() => onRemove(item.id)}
                    />
                ))}
            </ul>
        </section>
    );
}
