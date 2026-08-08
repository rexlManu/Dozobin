import {
    ArrowSquareOut,
    CloudSlash,
    DotsThree,
    LockKey,
    Play,
    Trash,
} from '@phosphor-icons/react';
import { CopyButton } from '@/components/copy-button';
import { ExpiryLabel } from '@/components/expiry';
import { FileGlyph } from '@/components/file-glyph';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { previewKind } from '@/lib/detect';
import { fileExtension, shareUrl } from '@/lib/format';
import { Link } from '@/lib/navigation';
import { isShareExpired } from '@/lib/share-state';
import type { Share } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * What a tile can actually show. A seeded video only has a poster behind it, so
 * it renders as a still; a real dropped one renders its own first frame.
 */
function Face({
    share,
    broken,
    now,
}: {
    share: Share;
    broken: boolean;
    now: number;
}) {
    if (broken) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-destructive">
                <CloudSlash weight="thin" className="size-8" />
                <span className="font-mono text-[10.5px] tracking-[0.08em] uppercase">
                    {isShareExpired(share, now) ? 'Expired' : 'Missing'}
                </span>
            </div>
        );
    }

    // A Paste has no thumbnail because a Paste has no cover: its body is the
    // whole thing, so the first lines are the truest preview available.
    if (share.kind === 'paste') {
        return (
            <pre className="h-full overflow-hidden px-3 py-2.5 font-mono text-[10px] leading-[1.6] whitespace-pre-wrap text-muted-foreground">
                {share.body.split('\n').slice(0, 10).join('\n') ||
                    'Empty paste'}
            </pre>
        );
    }

    const kind = previewKind(share.mime, share.filename);
    const src = share.objectUrl ?? share.demoSrc;

    if (src && kind === 'image') {
        return (
            <img
                src={src}
                alt=""
                loading="lazy"
                className="size-full bg-[repeating-conic-gradient(var(--muted)_0%_25%,transparent_0%_50%)] bg-[length:14px_14px] object-cover"
            />
        );
    }

    if (src && kind === 'video') {
        return (
            <div className="relative size-full">
                {share.objectUrl ? (
                    <video
                        src={src}
                        muted
                        playsInline
                        preload="metadata"
                        className="size-full object-cover"
                    />
                ) : (
                    <img
                        src={src}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover opacity-70"
                    />
                )}
                <span className="absolute inset-0 grid place-items-center">
                    <span className="flex size-9 items-center justify-center rounded-full border border-border-strong bg-background/85 backdrop-blur-sm">
                        <Play weight="fill" className="size-3.5" />
                    </span>
                </span>
            </div>
        );
    }

    // Nothing renderable. State the format rather than dressing it as a picture.
    return (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <FileGlyph
                mime={share.mime}
                filename={share.filename}
                className="size-7"
            />
            <span className="font-mono text-[10.5px] tracking-[0.08em] uppercase">
                {fileExtension(share.filename) ||
                    share.mime.split('/')[1] ||
                    'file'}
            </span>
        </div>
    );
}

export function LibraryTile({
    share,
    now,
    label,
    meta,
    selected,
    onSelect,
    onDelete,
}: {
    share: Share;
    now: number;
    label: string;
    meta: string;
    selected: boolean;
    onSelect: (value: boolean) => void;
    onDelete: () => void;
}) {
    const path = `${share.kind === 'file' ? '/s/' : '/p/'}${share.id}`;
    const broken = share.state === 'unavailable' || isShareExpired(share, now);

    return (
        <li
            className={cn(
                'group relative overflow-hidden rounded-lg border transition-colors',
                selected
                    ? 'border-primary bg-primary-soft/30'
                    : 'border-border bg-card hover:border-border-strong',
            )}
        >
            <Link
                to={path}
                className="block aspect-[4/3] bg-sunken"
                aria-label={label}
            >
                <Face share={share} broken={broken} now={now} />
            </Link>

            <div className="flex items-start gap-1.5 border-t border-border px-2.5 py-2">
                <div className="min-w-0 flex-1">
                    <p
                        className={cn(
                            'flex items-center gap-1.5 truncate text-[12.5px] font-medium',
                            share.kind === 'paste' &&
                                'font-mono text-[11.5px] font-normal',
                        )}
                    >
                        <span className="truncate">{label}</span>
                        {share.password && (
                            <LockKey className="size-3 shrink-0 text-muted-foreground" />
                        )}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-[10.5px] text-muted-foreground">
                        <span className="truncate">{meta}</span>
                        <ExpiryLabel
                            expiresAt={share.expiresAt}
                            className="text-[10.5px]"
                            prefix=""
                        />
                    </p>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${label}`}
                        >
                            <DotsThree weight="bold" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link to={path}>
                                <ArrowSquareOut /> Open share
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            variant="destructive"
                            onSelect={onDelete}
                        >
                            <Trash /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Overlay controls stay out of the way until the tile is pointed at,
          keyboard-focused, or actually selected. */}
            <div
                className={cn(
                    'absolute top-2 left-2 transition-opacity',
                    selected
                        ? 'opacity-100'
                        : 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100',
                )}
            >
                <Checkbox
                    checked={selected}
                    onCheckedChange={(value) => onSelect(value === true)}
                    aria-label={`Select ${label}`}
                    className="border-border-strong bg-background/90 backdrop-blur-sm"
                />
            </div>

            <div
                className={cn(
                    'absolute top-1.5 right-1.5 transition-opacity',
                    'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100',
                )}
            >
                <CopyButton
                    value={shareUrl(share)}
                    variant="ghost"
                    size="icon-sm"
                    label="Copy link"
                    className="bg-background/90 backdrop-blur-sm"
                />
            </div>
        </li>
    );
}
