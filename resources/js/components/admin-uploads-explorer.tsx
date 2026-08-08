import { router, usePage } from '@inertiajs/react';
import {
    CloudSlash,
    DotsThree,
    LockKey,
    MagnifyingGlass,
    ShieldCheck,
    Trash,
    X,
} from '@phosphor-icons/react';
import {
    createColumnHelper,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import type { SortingState } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/confirm-dialog';
import { DataTable } from '@/components/data-table';
import { ExpiryLabel } from '@/components/expiry';
import { FileGlyph } from '@/components/file-glyph';
import { LibraryTile } from '@/components/library-tile';
import { Badge } from '@/components/ui/badge';
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
import { formatBytes, relativeTime } from '@/lib/format';
import { Link } from '@/lib/navigation';
import {
    CATEGORY_LABEL,
    CATEGORY_ORDER,
    shareCategory,
    shareLabel,
    sharePath,
    shareSize,
    typeChip,
} from '@/lib/share-display';
import type { Category } from '@/lib/share-display';
import { isShareExpired } from '@/lib/share-state';
import type { Account, MalwareScanStatus, Share } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

/** The condition of a share, which is a different question from its type. */
type State = 'any' | 'live' | 'expired' | 'blocked' | 'missing' | 'protected';

const STATES: [State, string][] = [
    ['any', 'Any state'],
    ['live', 'Live'],
    ['expired', 'Expired'],
    ['blocked', 'Security blocked'],
    ['missing', 'Missing object'],
    ['protected', 'Password'],
];

const GUEST = '__guest';

function matchesState(share: Share, state: State): boolean {
    switch (state) {
        case 'live':
            return share.state === 'ready' && !isShareExpired(share);
        case 'expired':
            return isShareExpired(share);
        case 'missing':
            return share.state === 'unavailable';
        case 'blocked':
            return share.state === 'blocked';
        case 'protected':
            return share.password !== null;
        default:
            return true;
    }
}

const SCAN_LABEL: Record<MalwareScanStatus, string> = {
    pending: 'Pending',
    clean: 'Clean',
    detected: 'Detected',
    failed: 'Failed',
    skipped: 'Skipped',
};

function ScanStatusBadge({ share }: { share: Share }) {
    if (share.kind !== 'file') {
        return <span className="text-muted-foreground">—</span>;
    }

    const status = share.malwareScan?.status;
    const detail =
        share.malwareScan?.detectionName ??
        share.malwareScan?.error ??
        'This file has not been queued for scanning.';

    return (
        <Badge
            variant={
                status === 'detected' || status === 'failed'
                    ? 'destructive'
                    : status === 'pending'
                      ? 'secondary'
                      : 'outline'
            }
            title={detail}
        >
            {status ? SCAN_LABEL[status] : 'Not scanned'}
        </Badge>
    );
}

/**
 * The uploads table, optionally narrowed to one owner.
 *
 * The per-user page is this same component with `ownerId` fixed, rather than a
 * second table with the same columns: an administrator who learns the filters
 * here should not have to learn them again from the other direction.
 */
export function AdminUploadsExplorer({
    shares,
    accountList,
    ownerId,
}: {
    shares: Share[];
    accountList: Account[];
    ownerId?: string;
}) {
    const accounts = useMemo(
        () =>
            Object.fromEntries(
                accountList.map((account) => [account.id, account]),
            ),
        [accountList],
    );
    const malwareScanningEnabled =
        usePage<SharedPageProps>().props.config.malwareScanningEnabled;
    const { confirm, dialog } = useConfirm();

    const scoped = ownerId !== undefined;

    const [query, setQuery] = useState('');
    const [owner, setOwner] = useState<string>('all');
    const [state, setState] = useState<State>('any');
    const [types, setTypes] = useState<Category[]>([]);
    const [view, setView] = useState<View>('list');
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'createdAt', desc: true },
    ]);
    const [selection, setSelection] = useState<Record<string, boolean>>({});

    const ownerName = useCallback(
        (id: string | null) =>
            id ? (accounts[id]?.name ?? 'Deleted account') : null,
        [accounts],
    );

    /** Owners that actually hold something, so the menu never offers an empty pick. */
    const ownerOptions = useMemo(() => {
        const tally = new Map<string, number>();

        for (const share of shares) {
            tally.set(
                share.ownerId ?? GUEST,
                (tally.get(share.ownerId ?? GUEST) ?? 0) + 1,
            );
        }

        const named = [...tally.entries()]
            .filter(([id]) => id !== GUEST)
            .map(([id, count]) => ({
                id,
                label: accounts[id]?.name ?? 'Deleted account',
                count,
            }))
            .sort((a, b) => b.count - a.count);
        const guests = tally.get(GUEST) ?? 0;

        return guests > 0
            ? [...named, { id: GUEST, label: 'Guest', count: guests }]
            : named;
    }, [shares, accounts]);

    // Owner and state narrow first; the type counts below then describe what is
    // actually on the table rather than what is on the installation.
    const inScope = useMemo(() => {
        const byOwner = scoped
            ? shares.filter((s) => s.ownerId === ownerId)
            : owner === 'all'
              ? shares
              : owner === GUEST
                ? shares.filter((s) => s.ownerId === null)
                : shares.filter((s) => s.ownerId === owner);

        return byOwner.filter((s) => matchesState(s, state));
    }, [shares, scoped, ownerId, owner, state]);

    const typeCounts = useMemo(() => {
        const tally = {} as Record<Category, number>;

        for (const share of inScope) {
            const key = shareCategory(share);
            tally[key] = (tally[key] ?? 0) + 1;
        }

        return tally;
    }, [inScope]);

    const data = useMemo(
        () =>
            types.length === 0
                ? inScope
                : inScope.filter((s) => types.includes(shareCategory(s))),
        [inScope, types],
    );

    const removeSelected = useCallback(
        async (ids: string[]) => {
            const ok = await confirm({
                title: `Delete ${ids.length} ${ids.length === 1 ? 'share' : 'shares'}?`,
                description:
                    'The URLs stop working straight away, whoever owns them. Storage is credited back to each owner.',
                confirmLabel: 'Delete',
            });

            if (!ok) {
                return;
            }

            router.delete('/shares', {
                data: { ids },
                preserveScroll: true,
                onSuccess: () => {
                    setSelection({});
                    toast(
                        `${ids.length} ${ids.length === 1 ? 'share' : 'shares'} deleted`,
                    );
                },
            });
        },
        [confirm],
    );

    const queueScan = useCallback((share: Share) => {
        router.post(
            `/admin/uploads/${share.id}/malware-scan`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast(`Scan queued for ${shareLabel(share)}`),
                onError: (errors) =>
                    toast(
                        Object.values(errors)[0] ??
                            'The scan could not be queued.',
                    ),
            },
        );
    }, []);

    const canQueueScan = useCallback(
        (share: Share) =>
            malwareScanningEnabled &&
            share.kind === 'file' &&
            share.state === 'ready' &&
            !isShareExpired(share) &&
            (share.malwareScan?.status === null ||
                share.malwareScan?.status === undefined ||
                share.malwareScan.status === 'failed'),
        [malwareScanningEnabled],
    );

    const columns = useMemo(() => {
        const col = createColumnHelper<Share>();

        return [
            col.display({
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        aria-label="Select everything on this page"
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(v) =>
                            table.toggleAllPageRowsSelected(v === true)
                        }
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        aria-label={`Select ${shareLabel(row.original)}`}
                        checked={row.getIsSelected()}
                        onCheckedChange={(v) => row.toggleSelected(v === true)}
                    />
                ),
                meta: { className: 'w-8' },
            }),
            col.accessor((s) => shareLabel(s), {
                id: 'label',
                header: 'Share',
                cell: ({ row }) => {
                    const share = row.original;
                    const broken =
                        share.state !== 'ready' || isShareExpired(share);

                    return (
                        <div className="flex min-w-0 items-center gap-2">
                            <span
                                className={cn(
                                    'shrink-0',
                                    broken
                                        ? 'text-destructive'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {broken ? (
                                    <CloudSlash className="size-4" />
                                ) : (
                                    <FileGlyph
                                        mime={
                                            share.kind === 'file'
                                                ? share.mime
                                                : 'text/plain'
                                        }
                                        filename={
                                            share.kind === 'file'
                                                ? share.filename
                                                : 'paste'
                                        }
                                    />
                                )}
                            </span>
                            <Link
                                to={sharePath(share)}
                                className={cn(
                                    'truncate text-[13px] hover:underline',
                                    share.kind === 'paste' &&
                                        'font-mono text-[12px]',
                                )}
                            >
                                {shareLabel(share)}
                            </Link>
                            {share.password && (
                                <LockKey className="size-3.5 shrink-0 text-muted-foreground" />
                            )}
                        </div>
                    );
                },
            }),
            // The owner column is the one thing the scoped page already knows, so it
            // spends the width on something else.
            ...(scoped
                ? []
                : [
                      col.accessor(
                          (s: Share) => ownerName(s.ownerId) ?? 'Guest',
                          {
                              id: 'owner',
                              header: 'Owner',
                              cell: ({ row }) => {
                                  const id = row.original.ownerId;

                                  if (!id) {
                                      return (
                                          <span className="font-mono text-[11.5px] text-muted-foreground">
                                              Guest
                                          </span>
                                      );
                                  }

                                  const name = accounts[id]?.name;

                                  if (!name) {
                                      return (
                                          <span className="font-mono text-[11.5px] text-muted-foreground">
                                              Deleted
                                          </span>
                                      );
                                  }

                                  return (
                                      <Link
                                          to={`/admin/users/${id}`}
                                          className="text-[12.5px] hover:underline"
                                      >
                                          {name}
                                      </Link>
                                  );
                              },
                          },
                      ),
                  ]),
            col.accessor((s) => typeChip(s), {
                id: 'type',
                header: 'Type',
                cell: (c) => (
                    <span className="font-mono text-[11px] text-muted-foreground">
                        {c.getValue<string>()}
                    </span>
                ),
                meta: { className: 'hidden md:table-cell' },
            }),
            col.display({
                id: 'scan',
                header: 'Scan',
                cell: ({ row }) => <ScanStatusBadge share={row.original} />,
                meta: { className: 'hidden lg:table-cell' },
            }),
            col.accessor((s) => shareSize(s), {
                id: 'size',
                header: 'Size',
                cell: (c) => (
                    <span className="font-mono text-[11.5px]">
                        {formatBytes(c.getValue<number>())}
                    </span>
                ),
            }),
            col.accessor('views', {
                header: 'Views',
                cell: (c) => (
                    <span className="font-mono text-[11.5px]">
                        {c.getValue()}
                    </span>
                ),
                meta: { className: 'hidden lg:table-cell' },
            }),
            col.accessor('createdAt', {
                header: 'Added',
                cell: (c) => (
                    <span className="font-mono text-[11.5px] whitespace-nowrap text-muted-foreground">
                        {relativeTime(c.getValue())}
                    </span>
                ),
                meta: { className: 'hidden lg:table-cell' },
            }),
            // expiresAt is null for "never", which must sort last rather than first.
            col.accessor((s) => s.expiresAt ?? Number.POSITIVE_INFINITY, {
                id: 'expiresAt',
                header: 'Expires',
                cell: ({ row }) => (
                    <ExpiryLabel
                        expiresAt={row.original.expiresAt}
                        className="text-[11.5px]"
                        prefix=""
                    />
                ),
                meta: { className: 'hidden sm:table-cell' },
            }),
            col.display({
                id: 'actions',
                header: '',
                cell: ({ row }) => (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Share actions"
                                >
                                    <DotsThree weight="bold" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link to={sharePath(row.original)}>
                                        Open share
                                    </Link>
                                </DropdownMenuItem>
                                {canQueueScan(row.original) && (
                                    <DropdownMenuItem
                                        onSelect={() => queueScan(row.original)}
                                    >
                                        <ShieldCheck />
                                        {row.original.malwareScan?.status ===
                                        'failed'
                                            ? 'Retry scan'
                                            : 'Scan now'}
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    variant="destructive"
                                    onSelect={() =>
                                        void removeSelected([row.original.id])
                                    }
                                >
                                    <Trash /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ),
                meta: { className: 'w-10' },
            }),
        ];
    }, [accounts, canQueueScan, ownerName, queueScan, removeSelected, scoped]);

    // React Compiler intentionally leaves TanStack Table's mutable adapter alone.
    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data,
        columns,
        state: { sorting, globalFilter: query, rowSelection: selection },
        onSortingChange: setSorting,
        onGlobalFilterChange: setQuery,
        onRowSelectionChange: setSelection,
        getRowId: (row) => row.id,
        globalFilterFn: (row, _id, value) => {
            const needle = String(value).toLowerCase();
            const owner = ownerName(row.original.ownerId) ?? 'guest';

            return (
                shareLabel(row.original).toLowerCase().includes(needle) ||
                owner.toLowerCase().includes(needle)
            );
        },
        // A grid of tiles needs more per page than a list of rows, or the pager
        // does the scrolling that the eye was supposed to do.
        initialState: { pagination: { pageSize: 25 } },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const selectedIds = Object.keys(selection).filter((id) => selection[id]);
    const rows = table.getRowModel().rows;
    const narrowed =
        types.length > 0 ||
        state !== 'any' ||
        (!scoped && owner !== 'all') ||
        query !== '';

    const toggleType = (key: Category) =>
        setTypes((current) =>
            current.includes(key)
                ? current.filter((value) => value !== key)
                : [...current, key],
        );

    return (
        <>
            <DataTable
                table={table}
                unit="share"
                card={(row) => {
                    const share = row.original;
                    const broken =
                        share.state !== 'ready' || isShareExpired(share);
                    const owner = ownerName(share.ownerId);

                    return (
                        <div className="flex items-start gap-3">
                            <Checkbox
                                aria-label={`Select ${shareLabel(share)}`}
                                className="mt-1 shrink-0"
                                checked={row.getIsSelected()}
                                onCheckedChange={(v) =>
                                    row.toggleSelected(v === true)
                                }
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={cn(
                                            'shrink-0',
                                            broken
                                                ? 'text-destructive'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {broken ? (
                                            <CloudSlash className="size-4" />
                                        ) : (
                                            <FileGlyph
                                                mime={
                                                    share.kind === 'file'
                                                        ? share.mime
                                                        : 'text/plain'
                                                }
                                                filename={
                                                    share.kind === 'file'
                                                        ? share.filename
                                                        : 'paste'
                                                }
                                            />
                                        )}
                                    </span>
                                    <Link
                                        to={sharePath(share)}
                                        className={cn(
                                            'truncate text-[13.5px] font-medium',
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
                                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px] text-muted-foreground">
                                    {!scoped && (
                                        <>
                                            {share.ownerId && owner ? (
                                                <Link
                                                    to={`/admin/users/${share.ownerId}`}
                                                    className="text-foreground"
                                                >
                                                    {owner}
                                                </Link>
                                            ) : (
                                                <span>{owner ?? 'Guest'}</span>
                                            )}
                                            <span
                                                aria-hidden
                                                className="text-border-strong"
                                            >
                                                ·
                                            </span>
                                        </>
                                    )}
                                    <span>{typeChip(share)}</span>
                                    <span
                                        aria-hidden
                                        className="text-border-strong"
                                    >
                                        ·
                                    </span>
                                    <span>{formatBytes(shareSize(share))}</span>
                                    <span
                                        aria-hidden
                                        className="text-border-strong"
                                    >
                                        ·
                                    </span>
                                    <ExpiryLabel
                                        expiresAt={share.expiresAt}
                                        className="text-[11px]"
                                        prefix=""
                                    />
                                    {share.kind === 'file' && (
                                        <>
                                            <span
                                                aria-hidden
                                                className="text-border-strong"
                                            >
                                                ·
                                            </span>
                                            <span>
                                                {share.malwareScan?.status
                                                    ? SCAN_LABEL[
                                                          share.malwareScan
                                                              .status
                                                      ]
                                                    : 'Not scanned'}
                                            </span>
                                        </>
                                    )}
                                </p>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className="shrink-0"
                                        aria-label="Share actions"
                                    >
                                        <DotsThree weight="bold" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link to={sharePath(share)}>
                                            Open share
                                        </Link>
                                    </DropdownMenuItem>
                                    {canQueueScan(share) && (
                                        <DropdownMenuItem
                                            onSelect={() => queueScan(share)}
                                        >
                                            <ShieldCheck />
                                            {share.malwareScan?.status ===
                                            'failed'
                                                ? 'Retry scan'
                                                : 'Scan now'}
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onSelect={() =>
                                            void removeSelected([share.id])
                                        }
                                    >
                                        <Trash /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                }}
                toolbar={
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <div className="relative min-w-0 flex-1">
                                <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={
                                        scoped
                                            ? "Search this account's shares"
                                            : 'Search every share on this installation'
                                    }
                                    aria-label="Search uploads"
                                    className="pl-9"
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

                            {/* The two filters share the row with the view switch and would
                  overflow a phone at their desktop widths, so they split the
                  space instead and the switch keeps its intrinsic size. */}
                            <div className="flex items-center gap-2 max-sm:w-full">
                                {!scoped && (
                                    <Select
                                        value={owner}
                                        onValueChange={setOwner}
                                    >
                                        <SelectTrigger
                                            aria-label="Filter by owner"
                                            className="w-[11rem] text-[13px] max-sm:w-auto max-sm:min-w-0 max-sm:flex-1"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent position="popper">
                                            <SelectItem value="all">
                                                All owners
                                            </SelectItem>
                                            {ownerOptions.map((option) => (
                                                <SelectItem
                                                    key={option.id}
                                                    value={option.id}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <Select
                                    value={state}
                                    onValueChange={(v) => setState(v as State)}
                                >
                                    <SelectTrigger
                                        aria-label="Filter by state"
                                        className="w-[9.5rem] text-[13px] max-sm:w-auto max-sm:min-w-0 max-sm:flex-1"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        {STATES.map(([id, label]) => (
                                            <SelectItem key={id} value={id}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <ViewSwitch view={view} onView={setView} />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                            {CATEGORY_ORDER.filter(
                                (key) => (typeCounts[key] ?? 0) > 0,
                            ).map((key) => {
                                const on = types.includes(key);

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        aria-pressed={on}
                                        onClick={() => toggleType(key)}
                                        className={cn(
                                            'inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[12px] font-medium transition-colors',
                                            on
                                                ? 'border-transparent bg-foreground text-background'
                                                : 'border-border text-muted-foreground hover:border-border-strong hover:text-foreground',
                                        )}
                                    >
                                        {CATEGORY_LABEL[key]}
                                        <span
                                            className={cn(
                                                'font-mono text-[10.5px]',
                                                on
                                                    ? 'opacity-60'
                                                    : 'opacity-70',
                                            )}
                                        >
                                            {typeCounts[key]}
                                        </span>
                                    </button>
                                );
                            })}
                            {narrowed && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-auto"
                                    onClick={() => {
                                        setTypes([]);
                                        setState('any');
                                        setOwner('all');
                                        setQuery('');
                                    }}
                                >
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    </div>
                }
                grid={
                    view === 'grid' ? (
                        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {rows.map((row) => (
                                <LibraryTile
                                    key={row.id}
                                    share={row.original}
                                    label={shareLabel(row.original)}
                                    meta={`${typeChip(row.original)} · ${formatBytes(shareSize(row.original))}`}
                                    selected={row.getIsSelected()}
                                    onSelect={(value) =>
                                        row.toggleSelected(value)
                                    }
                                    onDelete={() =>
                                        void removeSelected([row.original.id])
                                    }
                                />
                            ))}
                        </ul>
                    ) : undefined
                }
                selectionBar={
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void removeSelected(selectedIds)}
                    >
                        <Trash /> Delete selected
                    </Button>
                }
                empty={
                    <>
                        <p className="text-[14px] font-medium">
                            {narrowed
                                ? 'Nothing matches that'
                                : 'Nothing has been shared yet'}
                        </p>
                        <p className="mx-auto mt-1.5 max-w-[42ch] text-[13px] leading-relaxed text-muted-foreground">
                            {narrowed
                                ? 'Try a shorter search, or clear the filters.'
                                : 'Uploads appear here the moment anyone on this installation shares something.'}
                        </p>
                    </>
                }
            />
            {dialog}
        </>
    );
}
