import { router, usePage } from '@inertiajs/react';
import {
    DotsThree,
    Info,
    MagnifyingGlass,
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
import { Countdown } from '@/components/expiry';
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { requestJson } from '@/lib/api';
import { formatBytes, relativeTime } from '@/lib/format';
import { Link } from '@/lib/navigation';
import {
    isTransferExpired,
    mergeTransfers,
    transferExpiresAt,
} from '@/lib/transfer-state';
import type { TransferSession } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

type Only = 'all' | 'running' | 'past';

function sessionSize(session: TransferSession): number {
    return session.items.reduce((sum, item) => sum + item.size, 0);
}

function StateChip({ live, mine }: { live: boolean; mine: boolean }) {
    if (!live) {
        return (
            <span className="text-[12.5px] text-muted-foreground">Ended</span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 text-[12.5px]">
            <span aria-hidden className="size-1.5 rounded-full bg-primary" />
            Running
            {mine && (
                <span className="font-mono text-[10.5px] text-muted-foreground">
                    this device
                </span>
            )}
        </span>
    );
}

export function AdminTransfersRoute({
    transfer: live,
    transferHistory: history,
}: {
    transfer: TransferSession | null;
    transferHistory: TransferSession[];
}) {
    const sessions = useMemo(
        () => mergeTransfers(live, history),
        [live, history],
    );
    const liveCode = live?.code ?? null;
    const windowMs =
        usePage<SharedPageProps>().props.config.transferWindowHours *
        60 *
        60 *
        1000;
    const { confirm, dialog } = useConfirm();

    const [query, setQuery] = useState('');
    const [only, setOnly] = useState<Only>('all');
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'lastActivityAt', desc: true },
    ]);
    const [selection, setSelection] = useState<Record<string, boolean>>({});

    const data = useMemo(() => {
        if (only === 'running') {
            return sessions.filter((s) => !isTransferExpired(s, windowMs));
        }

        if (only === 'past') {
            return sessions.filter((s) => isTransferExpired(s, windowMs));
        }

        return sessions;
    }, [sessions, only, windowMs]);

    const endOne = useCallback(
        async (session: TransferSession) => {
            const ok = await confirm({
                title: `End session ${session.code}?`,
                description:
                    'Every device in it is dropped and the items go with the session, exactly as they would when the window runs out.',
                confirmLabel: 'End session',
            });

            if (!ok) {
                return;
            }

            await requestJson(`/admin/sessions/${session.code}`, {
                method: 'DELETE',
            });
            router.reload({
                only: ['transfer', 'transferHistory'],
                onSuccess: () => toast(`Session ${session.code} ended`),
            });
        },
        [confirm],
    );

    const forgetSelected = useCallback(
        async (codes: string[]) => {
            const live = codes.filter((code) =>
                sessions.some(
                    (s) => s.code === code && !isTransferExpired(s, windowMs),
                ),
            );
            const ok = await confirm({
                title: `Forget ${codes.length} ${codes.length === 1 ? 'session' : 'sessions'}?`,
                description:
                    live.length > 0
                        ? `${live.length} of these ${live.length === 1 ? 'is' : 'are'} still running and will be ended first. The records go with them, so the activity log is gone too.`
                        : 'Only the records go — these sessions already dropped their items when they ended.',
                confirmLabel: 'Forget',
            });

            if (!ok) {
                return;
            }

            await Promise.all(
                codes.map((code) =>
                    requestJson(`/admin/sessions/${code}?forget=1`, {
                        method: 'DELETE',
                    }),
                ),
            );
            router.reload({
                only: ['transfer', 'transferHistory'],
                onSuccess: () => {
                    setSelection({});
                    toast(
                        `${codes.length} ${codes.length === 1 ? 'record' : 'records'} removed`,
                    );
                },
            });
        },
        [confirm, sessions, windowMs],
    );

    const columns = useMemo(() => {
        const col = createColumnHelper<TransferSession>();

        return [
            col.display({
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        aria-label="Select every session on this page"
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(v) =>
                            table.toggleAllPageRowsSelected(v === true)
                        }
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        aria-label={`Select session ${row.original.code}`}
                        checked={row.getIsSelected()}
                        onCheckedChange={(v) => row.toggleSelected(v === true)}
                    />
                ),
                meta: { className: 'w-8' },
            }),
            col.accessor('code', {
                header: 'Code',
                cell: ({ row }) => {
                    const session = row.original;
                    const live = !isTransferExpired(session, windowMs);

                    // Only the session this browser is actually in has a page to open.
                    return live && session.code === liveCode ? (
                        <Link
                            to={`/transfer/${session.code}`}
                            className="font-mono text-[12.5px] hover:underline"
                        >
                            {session.code}
                        </Link>
                    ) : (
                        <span className="font-mono text-[12.5px]">
                            {session.code}
                        </span>
                    );
                },
            }),
            col.accessor((s) => (isTransferExpired(s, windowMs) ? 0 : 1), {
                id: 'state',
                header: 'State',
                cell: ({ row }) => (
                    <StateChip
                        live={!isTransferExpired(row.original, windowMs)}
                        mine={row.original.code === liveCode}
                    />
                ),
            }),
            col.accessor((s) => s.participants.length, {
                id: 'devices',
                header: 'Devices',
                cell: ({ row }) => (
                    <span className="flex items-center gap-1.5">
                        <span className="font-mono text-[11.5px]">
                            {row.original.participants.length}
                        </span>
                        <span className="hidden truncate text-[12px] text-muted-foreground lg:inline">
                            {row.original.participants
                                .map((p) => p.label)
                                .join(', ')}
                        </span>
                    </span>
                ),
                meta: { className: 'hidden sm:table-cell' },
            }),
            col.accessor((s) => s.items.length, {
                id: 'items',
                header: 'Items',
                cell: ({ row }) => {
                    const session = row.original;

                    // An ended session dropped its payload, so a 0 here would read as
                    // "nothing was ever shared" when the truth is "nothing is left".
                    if (isTransferExpired(session, windowMs)) {
                        return (
                            <span className="font-mono text-[11.5px] text-muted-foreground">
                                —
                            </span>
                        );
                    }

                    return (
                        <span className="font-mono text-[11.5px]">
                            {session.items.length}
                            <span className="text-muted-foreground">
                                {' '}
                                · {formatBytes(sessionSize(session))}
                            </span>
                        </span>
                    );
                },
            }),
            col.accessor('createdAt', {
                header: 'Started',
                cell: (c) => (
                    <span className="font-mono text-[11.5px] whitespace-nowrap text-muted-foreground">
                        {relativeTime(c.getValue())}
                    </span>
                ),
                meta: { className: 'hidden lg:table-cell' },
            }),
            col.accessor('lastActivityAt', {
                header: 'Last activity',
                cell: (c) => (
                    <span className="font-mono text-[11.5px] whitespace-nowrap text-muted-foreground">
                        {relativeTime(c.getValue())}
                    </span>
                ),
            }),
            col.accessor(
                (s) =>
                    isTransferExpired(s, windowMs)
                        ? 0
                        : transferExpiresAt(s, windowMs),
                {
                    id: 'expiresAt',
                    header: 'Expires',
                    cell: ({ row }) => {
                        const session = row.original;

                        if (isTransferExpired(session, windowMs)) {
                            return (
                                <span className="font-mono text-[11.5px] text-muted-foreground">
                                    —
                                </span>
                            );
                        }

                        return (
                            <Countdown
                                target={transferExpiresAt(session, windowMs)}
                                className="text-[11.5px]"
                            />
                        );
                    },
                    meta: { className: 'hidden sm:table-cell' },
                },
            ),
            col.display({
                id: 'actions',
                header: '',
                cell: ({ row }) => {
                    const session = row.original;
                    const live = !isTransferExpired(session, windowMs);

                    return (
                        <div className="flex justify-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label={`Actions for ${session.code}`}
                                    >
                                        <DotsThree weight="bold" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-48"
                                >
                                    {live && session.code === liveCode && (
                                        <DropdownMenuItem asChild>
                                            <Link
                                                to={`/transfer/${session.code}`}
                                            >
                                                Open session
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    {live && (
                                        <DropdownMenuItem
                                            onSelect={() =>
                                                void endOne(session)
                                            }
                                        >
                                            End session
                                        </DropdownMenuItem>
                                    )}
                                    {live && <DropdownMenuSeparator />}
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onSelect={() =>
                                            void forgetSelected([session.code])
                                        }
                                    >
                                        <Trash /> Forget record
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                },
                meta: { className: 'w-10' },
            }),
        ];
    }, [windowMs, liveCode, endOne, forgetSelected]);

    // React Compiler intentionally leaves TanStack Table's mutable adapter alone.
    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data,
        columns,
        state: { sorting, globalFilter: query, rowSelection: selection },
        onSortingChange: setSorting,
        onGlobalFilterChange: setQuery,
        onRowSelectionChange: setSelection,
        getRowId: (row) => row.code,
        globalFilterFn: (row, _id, value) => {
            const needle = String(value).toLowerCase();

            return (
                row.original.code.toLowerCase().includes(needle) ||
                row.original.participants.some((p) =>
                    p.label.toLowerCase().includes(needle),
                )
            );
        },
        initialState: { pagination: { pageSize: 15 } },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const selectedCodes = Object.keys(selection).filter(
        (code) => selection[code],
    );
    const running = sessions.filter(
        (s) => !isTransferExpired(s, windowMs),
    ).length;

    return (
        <>
            <div className="flex flex-col gap-5">
                <header>
                    <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
                        Transfer sessions
                    </h2>
                    <p className="mt-1.5 flex max-w-[62ch] flex-wrap items-center gap-x-1.5 text-[13px] leading-relaxed text-muted-foreground">
                        {running === 0
                            ? 'Nothing is running right now.'
                            : `${running} ${running === 1 ? 'session is' : 'sessions are'} running.`}{' '}
                        Each one ends after{' '}
                        {Math.round(windowMs / (60 * 60 * 1000))} h without
                        activity, which you set in{' '}
                        <Link
                            to="/admin/settings/transfer"
                            className="text-foreground hover:underline"
                        >
                            Site settings
                        </Link>
                        .
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    aria-label="Why there are no account names here"
                                    className="text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    <Info className="size-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[38ch]">
                                A Transfer Session needs no account, so there is
                                nobody to name. Devices identify themselves with
                                a label and nothing else.
                            </TooltipContent>
                        </Tooltip>
                    </p>
                </header>

                <DataTable
                    table={table}
                    unit="session"
                    card={(row) => {
                        const session = row.original;
                        const running = !isTransferExpired(session, windowMs);

                        return (
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    aria-label={`Select session ${session.code}`}
                                    className="mt-1 shrink-0"
                                    checked={row.getIsSelected()}
                                    onCheckedChange={(v) =>
                                        row.toggleSelected(v === true)
                                    }
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                        {running &&
                                        session.code === liveCode ? (
                                            <Link
                                                to={`/transfer/${session.code}`}
                                                className="font-mono text-[13px]"
                                            >
                                                {session.code}
                                            </Link>
                                        ) : (
                                            <span className="font-mono text-[13px]">
                                                {session.code}
                                            </span>
                                        )}
                                        <StateChip
                                            live={running}
                                            mine={session.code === liveCode}
                                        />
                                    </div>
                                    <p className="mt-1 truncate text-[12px] text-muted-foreground">
                                        {session.participants
                                            .map((p) => p.label)
                                            .join(', ')}
                                    </p>
                                    <p className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-muted-foreground">
                                        {running ? (
                                            <>
                                                <span>
                                                    {session.items.length} ·{' '}
                                                    {formatBytes(
                                                        sessionSize(session),
                                                    )}
                                                </span>
                                                <span
                                                    aria-hidden
                                                    className="text-border-strong"
                                                >
                                                    ·
                                                </span>
                                                <Countdown
                                                    target={transferExpiresAt(
                                                        session,
                                                        windowMs,
                                                    )}
                                                    className="text-[11px]"
                                                />
                                            </>
                                        ) : (
                                            <span>
                                                ended{' '}
                                                {relativeTime(
                                                    session.lastActivityAt,
                                                )}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="shrink-0"
                                            aria-label={`Actions for ${session.code}`}
                                        >
                                            <DotsThree weight="bold" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="w-48"
                                    >
                                        {running &&
                                            session.code === liveCode && (
                                                <DropdownMenuItem asChild>
                                                    <Link
                                                        to={`/transfer/${session.code}`}
                                                    >
                                                        Open session
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}
                                        {running && (
                                            <DropdownMenuItem
                                                onSelect={() =>
                                                    void endOne(session)
                                                }
                                            >
                                                End session
                                            </DropdownMenuItem>
                                        )}
                                        {running && <DropdownMenuSeparator />}
                                        <DropdownMenuItem
                                            variant="destructive"
                                            onSelect={() =>
                                                void forgetSelected([
                                                    session.code,
                                                ])
                                            }
                                        >
                                            <Trash /> Forget record
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        );
                    }}
                    toolbar={
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative min-w-0 flex-1">
                                <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search codes and devices"
                                    aria-label="Search sessions"
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
                            <Select
                                value={only}
                                onValueChange={(v) => setOnly(v as Only)}
                            >
                                <SelectTrigger
                                    aria-label="Filter sessions"
                                    className="w-[10.5rem] text-[13px]"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    <SelectItem value="all">
                                        All sessions
                                    </SelectItem>
                                    <SelectItem value="running">
                                        Running
                                    </SelectItem>
                                    <SelectItem value="past">Ended</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    }
                    selectionBar={
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => void forgetSelected(selectedCodes)}
                        >
                            <Trash /> Forget records
                        </Button>
                    }
                    empty={
                        <>
                            <p className="text-[14px] font-medium">
                                {only === 'running'
                                    ? 'Nothing is running'
                                    : 'No sessions match that'}
                            </p>
                            <p
                                className={cn(
                                    'mx-auto mt-1.5 max-w-[44ch] text-[13px] leading-relaxed text-muted-foreground',
                                )}
                            >
                                {only === 'running'
                                    ? 'A session appears here the moment any device opens one, with no account needed.'
                                    : 'Try a shorter search, or switch the filter back to All sessions.'}
                            </p>
                        </>
                    }
                />
            </div>
            {dialog}
        </>
    );
}
