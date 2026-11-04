import { router, useForm, usePage } from '@inertiajs/react';
import { MagnifyingGlass, Plus, WarningCircle, X } from '@phosphor-icons/react';
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
import {
    AdminLayout,
    AdminPageHead,
    Meter,
    Tag,
} from '@/components/admin-layout';
import type { TagTone } from '@/components/admin-layout';
import { AppProviders } from '@/components/app-providers';
import { useConfirm } from '@/components/confirm-dialog';
import { CopyButton } from '@/components/copy-button';
import { DataTable } from '@/components/data-table';
import { ExpiryLabel } from '@/components/expiry';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useNow } from '@/hooks/use-now';
import { relativeTime } from '@/lib/format';
import { Link } from '@/lib/navigation';
import type { InviteCode, InviteCodeStatus } from '@/lib/types';
import type { SharedPageProps } from '@/types';

interface InvitesPageProps extends SharedPageProps {
    invites: InviteCode[];
}

const STATUS_LABEL: Record<InviteCodeStatus, string> = {
    active: 'Active',
    expired: 'Expired',
    exhausted: 'Used up',
    revoked: 'Revoked',
};

type StatusFilter = 'any' | InviteCodeStatus;

const STATUS_FILTERS: [StatusFilter, string][] = [
    ['any', 'Any status'],
    ['active', 'Active'],
    ['expired', 'Expired'],
    ['exhausted', 'Used up'],
    ['revoked', 'Revoked'],
];

const STATUS_TONE: Record<InviteCodeStatus, TagTone> = {
    active: 'mint',
    expired: 'lamp',
    exhausted: 'muted',
    revoked: 'danger',
};

function StatusChip({ status }: { status: InviteCodeStatus }) {
    return <Tag tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Tag>;
}

/** The same meter the Users table uses for a quota, since it answers the same question. */
function UsesBar({ invite }: { invite: InviteCode }) {
    if (invite.maxUses === null) {
        return (
            <span className="text-[14px] font-bold whitespace-nowrap">
                {invite.uses}
                <span className="font-medium text-muted-foreground">
                    {' '}
                    of no limit
                </span>
            </span>
        );
    }

    return (
        <div className="flex min-w-[6.5rem] flex-col gap-1.5">
            <span className="text-[14px] font-bold whitespace-nowrap">
                {invite.uses}
                <span className="font-medium text-muted-foreground">
                    {' of '}
                    {invite.maxUses}
                </span>
            </span>
            <Meter
                ratio={Math.min(1, invite.uses / invite.maxUses)}
                full={invite.uses >= invite.maxUses}
            />
        </div>
    );
}

/**
 * Creating an invite is three answers, not a workspace, so it takes a modal
 * rather than a permanent panel above the list an administrator came here to
 * read. The form lives entirely inside it and resets on the way out, so a
 * half-typed name never survives to the next open.
 */
function CreateInviteDialog() {
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: '',
        max_uses: '',
        expires_at: '',
    });

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (!next) {
                    form.reset();
                    form.clearErrors();
                }
            }}
        >
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus /> New invite
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[26rem]">
                <DialogHeader>
                    <DialogTitle>New invite</DialogTitle>
                    <DialogDescription>
                        The link keeps working until it runs out of uses,
                        reaches its expiry, or you revoke it.
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="create-invite"
                    className="flex flex-col gap-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.transform((data) => ({
                            ...data,
                            max_uses: data.max_uses || null,
                            expires_at: data.expires_at
                                ? new Date(data.expires_at).toISOString()
                                : null,
                        }));
                        form.post('/admin/invites', {
                            preserveScroll: true,
                            onSuccess: () => {
                                form.reset();
                                setOpen(false);
                                toast('Invite created');
                            },
                        });
                    }}
                >
                    <Field data-invalid={Boolean(form.errors.name)}>
                        <FieldLabel htmlFor="invite-name">Name</FieldLabel>
                        <Input
                            id="invite-name"
                            autoFocus
                            value={form.data.name}
                            placeholder="Who or what this is for"
                            aria-invalid={Boolean(form.errors.name)}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                        />
                        <FieldError>{form.errors.name}</FieldError>
                    </Field>

                    <Field data-invalid={Boolean(form.errors.max_uses)}>
                        <FieldLabel htmlFor="invite-max-uses">
                            Use limit
                        </FieldLabel>
                        <Input
                            id="invite-max-uses"
                            type="number"
                            min={1}
                            max={1_000_000}
                            inputMode="numeric"

                            value={form.data.max_uses}
                            placeholder="No limit"
                            aria-invalid={Boolean(form.errors.max_uses)}
                            onChange={(event) =>
                                form.setData('max_uses', event.target.value)
                            }
                        />
                        <FieldDescription>
                            How many accounts this link may create.
                        </FieldDescription>
                        <FieldError>{form.errors.max_uses}</FieldError>
                    </Field>

                    <Field data-invalid={Boolean(form.errors.expires_at)}>
                        <FieldLabel htmlFor="invite-expires-at">
                            Expires
                        </FieldLabel>
                        <Input
                            id="invite-expires-at"
                            type="datetime-local"
                            value={form.data.expires_at}
                            aria-invalid={Boolean(form.errors.expires_at)}
                            onChange={(event) =>
                                form.setData('expires_at', event.target.value)
                            }
                        />
                        <FieldDescription>
                            Leave empty for no expiry.
                        </FieldDescription>
                        <FieldError>{form.errors.expires_at}</FieldError>
                    </Field>
                </form>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        form="create-invite"
                        disabled={!form.data.name.trim() || form.processing}
                    >
                        Create invite
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function InvitesContent() {
    const { config, invites } = usePage<InvitesPageProps>().props;
    const { confirm, dialog } = useConfirm();
    const now = useNow(30_000);
    const registrationEnabled = config.registration === 'invite';

    const [query, setQuery] = useState('');
    const [statusOnly, setStatusOnly] = useState<StatusFilter>('any');
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'createdAt', desc: true },
    ]);

    const revoke = useCallback(
        async (invite: InviteCode) => {
            const ok = await confirm({
                title: 'Revoke this invite?',
                description: (
                    <>
                        The link for{' '}
                        <span className="text-foreground">{invite.name}</span>{' '}
                        will stop accepting registrations. Accounts already
                        created with it stay active.
                    </>
                ),
                confirmLabel: 'Revoke',
            });

            if (ok) {
                router.delete(`/admin/invites/${invite.id}`, {
                    preserveScroll: true,
                    onSuccess: () => toast('Invite revoked'),
                });
            }
        },
        [confirm],
    );

    const data = useMemo(
        () =>
            invites.filter(
                (invite) =>
                    statusOnly === 'any' || invite.status === statusOnly,
            ),
        [invites, statusOnly],
    );

    /**
     * Copy and Revoke sit in the row rather than behind a menu: there are only
     * two of them, and the copy is the entire reason this page exists.
     */
    const rowActions = useCallback(
        (invite: InviteCode) => {
            const active = invite.status === 'active';

            return (
                <div className="flex shrink-0 items-center justify-end gap-1">
                    {active && registrationEnabled && (
                        <CopyButton
                            value={invite.shareUrl}
                            variant="ghost"
                            size="icon-sm"
                            label={`Copy the link for ${invite.name}`}
                        />
                    )}
                    {active && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void revoke(invite)}
                        >
                            Revoke
                        </Button>
                    )}
                </div>
            );
        },
        [registrationEnabled, revoke],
    );

    const columns = useMemo(() => {
        const col = createColumnHelper<InviteCode>();

        return [
            col.accessor('name', {
                header: 'Invite',
                cell: ({ row }) => (
                    <div className="min-w-0">
                        <p className="truncate font-bold">
                            {row.original.name}
                        </p>
                        <p className="truncate font-mono text-[13px] text-muted-foreground">
                            {row.original.code}
                        </p>
                    </div>
                ),
            }),
            col.accessor('status', {
                header: 'Status',
                cell: ({ row }) => <StatusChip status={row.original.status} />,
            }),
            // Sorts on how much of the allowance is gone, not the raw count:
            // 4 of 5 is closer to done than 9 of a hundred.
            col.accessor(
                (invite) =>
                    invite.maxUses === null
                        ? 0
                        : Math.min(1, invite.uses / invite.maxUses),
                {
                    id: 'uses',
                    header: 'Uses',
                    cell: ({ row }) => <UsesBar invite={row.original} />,
                },
            ),
            col.accessor(
                (invite) => invite.expiresAt ?? Number.MAX_SAFE_INTEGER,
                {
                    id: 'expiresAt',
                    header: 'Expires',
                    cell: ({ row }) => (
                        <ExpiryLabel
                            expiresAt={row.original.expiresAt}
                            className="text-[14px] whitespace-nowrap"
                        />
                    ),
                    meta: { className: 'hidden sm:table-cell' },
                },
            ),
            col.accessor('createdAt', {
                header: 'Created',
                cell: (c) => (
                    <span className="text-[14px] whitespace-nowrap text-muted-foreground">
                        {relativeTime(c.getValue(), now)}
                    </span>
                ),
                meta: { className: 'hidden lg:table-cell' },
            }),
            col.display({
                id: 'actions',
                header: '',
                cell: ({ row }) => rowActions(row.original),
                meta: { className: 'w-10 whitespace-nowrap' },
            }),
        ];
    }, [now, rowActions]);

    // React Compiler intentionally leaves TanStack Table's mutable adapter alone.
    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data,
        columns,
        state: { sorting, globalFilter: query },
        onSortingChange: setSorting,
        onGlobalFilterChange: setQuery,
        getRowId: (row) => row.id,
        globalFilterFn: (row, _id, value) => {
            const needle = String(value).toLowerCase();

            return (
                row.original.name.toLowerCase().includes(needle) ||
                row.original.code.toLowerCase().includes(needle)
            );
        },
        initialState: { pagination: { pageSize: 10 } },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const active = invites.filter(
        (invite) => invite.status === 'active',
    ).length;
    const narrowed = statusOnly !== 'any' || query !== '';

    return (
        <>
            <AdminPageHead
                title="Invites"
                description={
                    active === 0
                        ? 'No invite accepts registrations right now.'
                        : `${active} ${active === 1 ? 'invite accepts' : 'invites accept'} registrations.`
                }
                action={<CreateInviteDialog />}
            />

            {!registrationEnabled && (
                <p className="flex items-start gap-2.5 rounded-[20px] bg-warn-soft px-4 py-3 text-lamp">
                    <WarningCircle
                        weight="fill"
                        className="mt-0.5 size-[18px] shrink-0"
                    />
                    <span>
                        Registration is {config.registration}, so these links
                        let nobody in. Set it to Invite only under{' '}
                        <Link
                            to="/admin/settings/access"
                            className="font-bold underline underline-offset-4"
                        >
                            Access
                        </Link>{' '}
                        first.
                    </span>
                </p>
            )}

            <DataTable
                table={table}
                unit="invite"
                card={(row) => {
                    const invite = row.original;

                    return (
                        <div className="flex items-center gap-3">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                    <p className="min-w-0 truncate font-bold">
                                        {invite.name}
                                    </p>
                                    <StatusChip status={invite.status} />
                                </div>
                                <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                                    <span className="font-mono">
                                        {invite.code}
                                    </span>{' '}
                                    · {invite.uses}
                                    {invite.maxUses === null
                                        ? ' used'
                                        : ` of ${invite.maxUses} used`}{' '}
                                    ·{' '}
                                    <ExpiryLabel
                                        expiresAt={invite.expiresAt}
                                        className="text-[13px]"
                                    />
                                </p>
                            </div>
                            {rowActions(invite)}
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
                                placeholder="Search names and codes"
                                aria-label="Search invites"
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
                        <div className="flex items-center gap-2 max-sm:w-full">
                            <Select
                                value={statusOnly}
                                onValueChange={(v) =>
                                    setStatusOnly(v as StatusFilter)
                                }
                            >
                                <SelectTrigger
                                    aria-label="Filter by status"
                                    className="w-[10rem] max-sm:min-w-0 max-sm:flex-1"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    {STATUS_FILTERS.map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {narrowed && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setStatusOnly('any');
                                        setQuery('');
                                    }}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                }
                empty={
                    <>
                        <p className="text-[17px] font-bold">
                            {narrowed
                                ? 'No invites match that'
                                : 'No invites yet'}
                        </p>
                        <p className="text-muted-foreground">
                            {narrowed
                                ? 'Try a shorter search, or show any status.'
                                : 'Use New invite to let someone register.'}
                        </p>
                    </>
                }
            />
            {dialog}
        </>
    );
}

export default function InvitesPage() {
    return (
        <AppProviders>
            <AdminLayout>
                <InvitesContent />
            </AdminLayout>
        </AppProviders>
    );
}
