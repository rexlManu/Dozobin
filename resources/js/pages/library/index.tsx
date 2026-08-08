import { router, usePage } from '@inertiajs/react';
import {
    ArrowSquareOut,
    CloudSlash,
    DotsThree,
    LockKey,
    MagnifyingGlass,
    Trash,
    X,
} from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { AppProviders } from '@/components/app-providers';
import { AppShell } from '@/components/app-shell';
import { useConfirm } from '@/components/confirm-dialog';
import { CopyButton } from '@/components/copy-button';
import { ExpiryLabel } from '@/components/expiry';
import { FileGlyph } from '@/components/file-glyph';
import { LibraryTile } from '@/components/library-tile';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { View } from '@/components/view-switch';
import { ViewSwitch } from '@/components/view-switch';
import { formatBytes, relativeTime, shareUrl } from '@/lib/format';
import { Link } from '@/lib/navigation';
import type { Category } from '@/lib/share-display';
import {
    CATEGORY_LABEL,
    CATEGORY_ORDER,
    shareCategory,
    shareLabel,
    shareSize,
    typeChip,
} from '@/lib/share-display';
import { isShareExpired } from '@/lib/share-state';
import type { Share } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

type Sort = 'created' | 'size' | 'expires';

/**
 * Multi-select rather than one-of, because "the media" is images and video
 * together and no single bucket can say that. Counts come from the search
 * result, so they answer "what is there to filter" and hold still while you
 * toggle. Chips sit at the 4px radius the system reserves for them.
 */
function TypeFilter({
    counts,
    active,
    onToggle,
    onClear,
}: {
    counts: Partial<Record<Category, number>>;
    active: Category[];
    onToggle: (category: Category) => void;
    onClear: () => void;
}) {
    const chip = (on: boolean, muted = false) =>
        cn(
            'inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[12px] font-medium transition-colors',
            on
                ? 'border-transparent bg-foreground text-background'
                : 'border-border text-muted-foreground hover:border-border-strong hover:text-foreground',
            muted && 'opacity-40',
        );

    // "Other" is a catch-all: showing it when nothing lands there is noise.
    const shown = CATEGORY_ORDER.filter(
        (key) => key !== 'other' || (counts.other ?? 0) > 0,
    );

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            <button
                type="button"
                aria-pressed={active.length === 0}
                onClick={onClear}
                className={chip(active.length === 0)}
            >
                All
            </button>
            {shown.map((key) => {
                const count = counts[key] ?? 0;
                const on = active.includes(key);

                return (
                    <button
                        key={key}
                        type="button"
                        aria-pressed={on}
                        disabled={count === 0 && !on}
                        onClick={() => onToggle(key)}
                        className={chip(on, count === 0 && !on)}
                    >
                        {CATEGORY_LABEL[key]}
                        <span
                            className={cn(
                                'font-mono text-[10.5px]',
                                on ? 'opacity-60' : 'opacity-70',
                            )}
                        >
                            {count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function Row({
    share,
    selected,
    onSelect,
    onDelete,
}: {
    share: Share;
    selected: boolean;
    onSelect: (value: boolean) => void;
    onDelete: () => void;
}) {
    const path = `${share.kind === 'file' ? '/s/' : '/p/'}${share.id}`;
    const broken = share.state === 'unavailable' || isShareExpired(share);

    return (
        <li
            className={cn(
                'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 px-3 py-3 transition-colors sm:grid-cols-[auto_minmax(0,1fr)_7rem_9rem_auto] sm:gap-x-4 sm:px-4',
                selected ? 'bg-primary-soft/40' : 'hover:bg-muted/50',
            )}
        >
            <Checkbox
                checked={selected}
                onCheckedChange={(value) => onSelect(value === true)}
                aria-label={`Select ${shareLabel(share)}`}
            />

            <div className="col-start-2 min-w-0">
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            'shrink-0',
                            broken
                                ? 'text-destructive'
                                : 'text-muted-foreground',
                        )}
                    >
                        {share.kind === 'file' ? (
                            broken ? (
                                <CloudSlash className="size-4" />
                            ) : (
                                <FileGlyph
                                    mime={share.mime}
                                    filename={share.filename}
                                />
                            )
                        ) : (
                            <FileGlyph
                                mime="text/plain"
                                filename={share.pasteType}
                            />
                        )}
                    </span>
                    <Link
                        to={path}
                        className={cn(
                            'truncate text-[13.5px] font-medium underline-offset-4 hover:underline',
                            share.kind === 'paste' &&
                                'font-mono text-[12.5px] font-normal',
                        )}
                    >
                        {shareLabel(share)}
                    </Link>
                    {share.password && (
                        <LockKey className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground sm:hidden">
                    <span>{typeChip(share)}</span>
                    <span>{formatBytes(shareSize(share))}</span>
                    <ExpiryLabel
                        expiresAt={share.expiresAt}
                        className="text-[11px]"
                        prefix=""
                    />
                </div>
                <p className="mt-1 hidden font-mono text-[11px] text-muted-foreground sm:block">
                    {typeChip(share)} · added {relativeTime(share.createdAt)}
                    {share.state === 'unavailable' && (
                        <span className="text-destructive">
                            {' '}
                            · stored object missing
                        </span>
                    )}
                </p>
            </div>

            <div className="hidden font-mono text-[11.5px] text-muted-foreground sm:block">
                {formatBytes(shareSize(share))}
            </div>
            <div className="hidden text-[11.5px] sm:block">
                <ExpiryLabel
                    expiresAt={share.expiresAt}
                    className="text-[11.5px]"
                    prefix=""
                />
            </div>

            <div className="flex items-center gap-0.5 justify-self-end">
                <CopyButton
                    value={shareUrl(share)}
                    variant="ghost"
                    size="icon-sm"
                    label="Copy link"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="More actions"
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
        </li>
    );
}

function LibraryRoute({ shares }: { shares: Share[] }) {
    const account = usePage<SharedPageProps>().props.auth.user;
    const { confirm, dialog } = useConfirm();

    const [query, setQuery] = useState('');
    const [types, setTypes] = useState<Category[]>([]);
    const [sort, setSort] = useState<Sort>('created');
    const [view, setView] = useState<View>('list');
    const [selection, setSelection] = useState<string[]>([]);

    const mine = useMemo(
        () => shares.filter((share) => share.ownerId === account?.id),
        [shares, account?.id],
    );

    const searched = useMemo(() => {
        const needle = query.trim().toLowerCase();

        if (!needle) {
            return mine;
        }

        return mine.filter((share) => {
            const haystack =
                share.kind === 'file'
                    ? `${share.filename} ${share.mime}`
                    : `${share.body} ${share.pasteType} ${share.language ?? ''}`;

            return haystack.toLowerCase().includes(needle);
        });
    }, [mine, query]);

    // Counted before the type filter is applied, so toggling a chip never
    // rewrites the numbers on the chips next to it.
    const counts = useMemo(() => {
        const tally: Partial<Record<Category, number>> = {};

        for (const share of searched) {
            const key = shareCategory(share);
            tally[key] = (tally[key] ?? 0) + 1;
        }

        return tally;
    }, [searched]);

    const visible = useMemo(() => {
        const filtered =
            types.length === 0
                ? searched
                : searched.filter((share) =>
                      types.includes(shareCategory(share)),
                  );

        return [...filtered].sort((a, b) => {
            if (sort === 'size') {
                return shareSize(b) - shareSize(a);
            }

            if (sort === 'expires') {
                const left = a.expiresAt ?? Number.POSITIVE_INFINITY;
                const right = b.expiresAt ?? Number.POSITIVE_INFINITY;

                return left - right;
            }

            return b.createdAt - a.createdAt;
        });
    }, [searched, types, sort]);

    const allSelected =
        visible.length > 0 && visible.every((s) => selection.includes(s.id));

    const removeSelected = async () => {
        const ok = await confirm({
            title: `Delete ${selection.length} ${selection.length === 1 ? 'share' : 'shares'}?`,
            description:
                'The URLs stop working straight away. Anyone still holding a link will get the expired page instead.',
            confirmLabel: 'Delete',
        });

        if (!ok) {
            return;
        }

        router.delete('/shares', {
            data: { ids: selection },
            preserveScroll: true,
            onSuccess: () => setSelection([]),
        });
    };

    // One confirmation, whichever view the share was deleted from.
    const removeOne = async (share: Share) => {
        const ok = await confirm({
            title: 'Delete this share?',
            description: (
                <>
                    <span className="font-mono text-foreground">
                        {shareLabel(share)}
                    </span>{' '}
                    goes away and its URL stops working. There is no undo.
                </>
            ),
            confirmLabel: 'Delete',
        });

        if (ok) {
            router.delete('/shares', {
                data: { ids: [share.id] },
                preserveScroll: true,
            });
        }
    };

    const toggleOne = (id: string, value: boolean) =>
        setSelection((current) =>
            value ? [...current, id] : current.filter((entry) => entry !== id),
        );

    const emptyState = (
        <div className="px-6 py-14 text-center">
            <p className="text-[14px] font-medium">
                {mine.length === 0
                    ? 'Nothing in the Library yet'
                    : 'No shares match that'}
            </p>
            <p className="mx-auto mt-1.5 max-w-[42ch] text-[13px] leading-relaxed text-muted-foreground">
                {mine.length === 0
                    ? 'Files and Pastes you create while signed in land here. Guest shares and Transfer Items never do.'
                    : 'Try a shorter search, or switch the filter back to All.'}
            </p>
            {mine.length === 0 && (
                <Button className="mt-5" asChild>
                    <Link to="/">Share something</Link>
                </Button>
            )}
        </div>
    );

    const bulkActions = (
        <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelection([])}>
                Clear
            </Button>
            <Button variant="destructive" size="sm" onClick={removeSelected}>
                <Trash /> Delete selected
            </Button>
        </div>
    );

    return (
        <AppShell>
            <div className="rail py-6 sm:py-8">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h1 className="text-xl font-medium tracking-[-0.02em]">
                        Library
                    </h1>
                    <p className="font-mono text-[11.5px] text-muted-foreground">
                        {mine.length} shares · flat, no folders
                    </p>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative min-w-0 flex-1">
                        <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search filenames and paste contents"
                            className="pl-9"
                            aria-label="Search the library"
                        />
                        {query && (
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Clear search"
                                className="absolute top-1/2 right-1 -translate-y-1/2"
                                onClick={() => setQuery('')}
                            >
                                <X />
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Select
                            value={sort}
                            onValueChange={(value) => setSort(value as Sort)}
                        >
                            <SelectTrigger
                                aria-label="Sort by"
                                className="w-[10.5rem]"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="created">
                                    Newest first
                                </SelectItem>
                                <SelectItem value="size">
                                    Largest first
                                </SelectItem>
                                <SelectItem value="expires">
                                    Expiring soonest
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <ViewSwitch view={view} onView={setView} />
                    </div>
                </div>

                <div className="mt-3">
                    <TypeFilter
                        counts={counts}
                        active={types}
                        onClear={() => setTypes([])}
                        onToggle={(category) =>
                            setTypes((current) =>
                                current.includes(category)
                                    ? current.filter(
                                          (entry) => entry !== category,
                                      )
                                    : [...current, category],
                            )
                        }
                    />
                </div>

                {view === 'list' ? (
                    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
                        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-border px-3 py-2.5 sm:grid-cols-[auto_minmax(0,1fr)_7rem_9rem_auto] sm:gap-x-4 sm:px-4">
                            <Checkbox
                                checked={allSelected}
                                aria-label="Select everything shown"
                                onCheckedChange={(value) =>
                                    setSelection(
                                        value === true
                                            ? visible.map((s) => s.id)
                                            : [],
                                    )
                                }
                            />
                            {selection.length > 0 ? (
                                <div className="col-start-2 col-end-[-1] flex items-center gap-3">
                                    <span className="text-[12.5px] font-medium">
                                        {selection.length} selected
                                    </span>
                                    {bulkActions}
                                </div>
                            ) : (
                                <>
                                    <span className="label-mono col-start-2">
                                        Share
                                    </span>
                                    <span className="label-mono hidden sm:block">
                                        Size
                                    </span>
                                    <span className="label-mono hidden sm:block">
                                        Expires
                                    </span>
                                    <span className="w-[4.6rem]" />
                                </>
                            )}
                        </div>

                        {visible.length === 0 ? (
                            emptyState
                        ) : (
                            <ul className="divide-y divide-border">
                                {visible.map((share) => (
                                    <Row
                                        key={share.id}
                                        share={share}
                                        selected={selection.includes(share.id)}
                                        onSelect={(value) =>
                                            toggleOne(share.id, value)
                                        }
                                        onDelete={() => removeOne(share)}
                                    />
                                ))}
                            </ul>
                        )}
                    </div>
                ) : (
                    // No outer card here: the tiles carry their own edges, and a card of
                    // cards is a box drawn around boxes.
                    <div className="mt-4">
                        <div className="flex items-center gap-3 border-b border-border pb-2.5">
                            <Checkbox
                                checked={allSelected}
                                aria-label="Select everything shown"
                                onCheckedChange={(value) =>
                                    setSelection(
                                        value === true
                                            ? visible.map((s) => s.id)
                                            : [],
                                    )
                                }
                            />
                            {selection.length > 0 ? (
                                <>
                                    <span className="text-[12.5px] font-medium">
                                        {selection.length} selected
                                    </span>
                                    {bulkActions}
                                </>
                            ) : (
                                <span className="label-mono">
                                    {visible.length}{' '}
                                    {visible.length === 1 ? 'share' : 'shares'}
                                </span>
                            )}
                        </div>

                        {visible.length === 0 ? (
                            emptyState
                        ) : (
                            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                {visible.map((share) => (
                                    <LibraryTile
                                        key={share.id}
                                        share={share}
                                        label={shareLabel(share)}
                                        meta={`${typeChip(share)} · ${formatBytes(shareSize(share))}`}
                                        selected={selection.includes(share.id)}
                                        onSelect={(value) =>
                                            toggleOne(share.id, value)
                                        }
                                        onDelete={() => removeOne(share)}
                                    />
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
            {dialog}
        </AppShell>
    );
}

export default function LibraryPage({ shares }: { shares: Share[] }) {
    return (
        <AppProviders>
            <LibraryRoute shares={shares} />
        </AppProviders>
    );
}
