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
import { DOZO_COLORS, Dozo } from '@/components/dozo';
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
import { useNow } from '@/hooks/use-now';
import { useOrigin } from '@/hooks/use-origin';
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

/*
  The column head and every row are separate grids, so they share one template.
  The actions track is a fixed width (two 28px icon buttons and their gap) rather
  than auto, otherwise the head, which has no buttons, sizes it differently and
  Size and Expires drift out from under their labels.
*/
const LIST_GRID =
    'grid grid-cols-[auto_minmax(0,1fr)_4.5rem] items-center gap-x-3 px-3 sm:grid-cols-[auto_minmax(0,1fr)_6.5rem_9rem_8.5rem] sm:gap-x-4 sm:px-4';

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
            'inline-flex items-center gap-1.5 rounded-[13px] border-[1.5px] px-3 py-1.5 text-[14px] font-bold transition-colors',
            on
                ? 'border-lamp bg-lamp text-warn-foreground'
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
                                'text-[12px]',
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
    now,
    selected,
    onSelect,
    onDelete,
}: {
    share: Share;
    now: number;
    selected: boolean;
    onSelect: (value: boolean) => void;
    onDelete: () => void;
}) {
    const path = `${share.kind === 'file' ? '/s/' : '/p/'}${share.id}`;
    const broken = share.state === 'unavailable' || isShareExpired(share, now);
    const origin = useOrigin();

    return (
        <li
            className={cn(
                LIST_GRID,
                'rounded-[18px] py-2.5 transition-colors',
                selected ? 'bg-accent' : 'bg-card hover:bg-sunken',
            )}
        >
            <Checkbox
                checked={selected}
                onCheckedChange={(value) => onSelect(value === true)}
                aria-label={`Select ${shareLabel(share)}`}
            />

            <div className="col-start-2 min-w-0">
                <div className="flex items-center gap-3">
                    <span
                        className={cn(
                            'grid size-9 shrink-0 place-items-center overflow-hidden rounded-[12px_13px_11px_14px]',
                            broken
                                ? 'bg-destructive-soft text-destructive'
                                : share.kind === 'paste'
                                  ? 'bg-lavender text-night'
                                  : 'bg-mint text-night',
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
                    <span className="grid min-w-0">
                        <span className="flex min-w-0 items-center gap-2">
                            <Link
                                to={path}
                                className="truncate font-bold underline-offset-4 hover:underline"
                            >
                                {shareLabel(share)}
                            </Link>
                            {share.password && (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-[9px] bg-lavender-soft px-2 py-0.5 text-[12px] font-bold text-lavender">
                                    <LockKey className="size-3.5" />
                                    <span className="max-sm:sr-only">
                                        Password
                                    </span>
                                </span>
                            )}
                        </span>
                        <span className="hidden truncate font-mono text-[11.5px] text-muted-foreground sm:block">
                            {origin.replace(/^https?:\/\//, '')}
                            {path}
                        </span>
                    </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-12 text-[13px] text-muted-foreground sm:hidden">
                    <span>{typeChip(share)}</span>
                    <span>{formatBytes(shareSize(share))}</span>
                    <ExpiryLabel
                        expiresAt={share.expiresAt}
                        className="text-[13px]"
                        prefix=""
                    />
                </div>
            </div>

            <div className="hidden text-[14px] tabular-nums sm:block">
                {formatBytes(shareSize(share))}
                <span className="block text-[12.5px] text-muted-foreground">
                    {relativeTime(share.createdAt, now)}
                </span>
            </div>
            <div className="hidden text-[14px] sm:block">
                <ExpiryLabel
                    expiresAt={share.expiresAt}
                    className="text-[14px]"
                    prefix=""
                />
                {share.state === 'unavailable' && (
                    <span className="block text-[12.5px] font-bold text-destructive">
                        File missing
                    </span>
                )}
            </div>

            <div className="flex items-center gap-1 justify-self-end">
                <CopyButton
                    value={shareUrl(share)}
                    variant="outline"
                    size="sm"
                    label="Copy link"
                    className="max-sm:hidden"
                />
                <CopyButton
                    value={shareUrl(share)}
                    variant="ghost"
                    size="icon-sm"
                    label="Copy link"
                    className="sm:hidden"
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
    const now = useNow(30_000);
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
                    <span className="text-foreground">{shareLabel(share)}</span>{' '}
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
        <div className="grid justify-items-center gap-1.5 rounded-[22px] bg-card px-6 py-12 text-center">
            <Dozo size={72} mood={mine.length === 0 ? 'calm' : 'sleep'} />
            <p className="mt-1 text-[16px] font-bold">
                {mine.length === 0
                    ? 'Nothing in the Library yet'
                    : 'No shares match that'}
            </p>
            <p className="max-w-[42ch] text-muted-foreground">
                {mine.length === 0
                    ? 'Files and text you send while signed in show up here.'
                    : 'Try a shorter search, or set the filter back to All.'}
            </p>
            {mine.length === 0 && (
                <Button className="mt-3" asChild>
                    <Link to="/">Send something</Link>
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
        <AppShell
            head={
                <div className="flex items-center gap-4">
                    <Dozo size={64} mood="happy" body={DOZO_COLORS[2]} />
                    <div className="grid gap-1">
                        <h1 className="text-[32px] leading-tight font-bold sm:text-[44px]">
                            Library
                        </h1>
                        {account && (
                            <Link
                                to="/settings/storage"
                                className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-muted-foreground hover:text-foreground"
                            >
                                <span>
                                    {mine.length}{' '}
                                    {mine.length === 1 ? 'share' : 'shares'} ·{' '}
                                    {formatBytes(account.storageUsed)} of{' '}
                                    {formatBytes(account.storageLimit)}
                                </span>
                                <span className="h-2 w-40 overflow-hidden rounded-full bg-sunken">
                                    <span
                                        className="block h-full rounded-full bg-lamp"
                                        style={{
                                            width: `${Math.max(2, Math.min(100, (account.storageUsed / account.storageLimit) * 100))}%`,
                                        }}
                                    />
                                </span>
                            </Link>
                        )}
                    </div>
                </div>
            }
        >
            <div className="rail pb-20">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative min-w-0 flex-1">
                        <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search names and text"
                            className="pl-10"
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

                <div className="mt-4">
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
                    <div className="mt-4">
                        <div className={cn(LIST_GRID, 'min-h-11 py-1.5')}>
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
                                    <span className="font-bold">
                                        {selection.length} selected
                                    </span>
                                    {bulkActions}
                                </div>
                            ) : (
                                <>
                                    <span className="label-meta col-start-2">
                                        Name
                                    </span>
                                    <span className="label-meta hidden sm:block">
                                        Size · sent
                                    </span>
                                    <span className="label-meta hidden sm:block">
                                        Link stays
                                    </span>
                                </>
                            )}
                        </div>

                        {visible.length === 0 ? (
                            emptyState
                        ) : (
                            <ul className="grid gap-1.5">
                                {visible.map((share) => (
                                    <Row
                                        key={share.id}
                                        share={share}
                                        now={now}
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
                        <div className="flex min-h-11 items-center gap-3 px-3">
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
                                    <span className="font-bold">
                                        {selection.length} selected
                                    </span>
                                    {bulkActions}
                                </>
                            ) : (
                                <span className="label-meta">
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
                                        now={now}
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
