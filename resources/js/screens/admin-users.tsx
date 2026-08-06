import {
    ArrowLeft,
    ArrowRight,
    ArrowsClockwise,
    DotsThree,
    Eye,
    MagnifyingGlass,
    Prohibit,
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
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/confirm-dialog';
import { DataTable } from '@/components/data-table';
import { ExpiryLabel } from '@/components/expiry';
import { FileGlyph } from '@/components/file-glyph';
import { InlineSelect } from '@/components/inline-select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { formatBytes, formatDateTime, relativeTime } from '@/lib/format';
import { Link, Navigate, useNavigate, useParams } from '@/lib/navigation';
import {
    countSharesByOwner,
    shareLabel,
    sharePath,
    typeChip,
    usageFromShares,
} from '@/lib/share-display';
import type { Account, AccountStatus, Share } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { GuardReason } from '@/store/store';
import { isShareExpired, useDozo } from '@/store/store';

const GUARD_COPY: Record<GuardReason, string> = {
    self: 'You cannot do this to your own account.',
    'last-admin': 'This is the last active administrator.',
    missing: 'That account no longer exists.',
};

function RoleChip({ role }: { role: Account['role'] }) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] font-medium',
                role === 'admin'
                    ? 'bg-foreground text-background border-transparent'
                    : 'border-border text-muted-foreground',
            )}
        >
            {role === 'admin' ? 'Admin' : 'Member'}
        </span>
    );
}

function StatusChip({ account }: { account: Account }) {
    if (account.status === 'active') {
        return (
            <span className="text-muted-foreground text-[12.5px]">Active</span>
        );
    }

    return (
        <span
            title={
                account.suspendedAt
                    ? `Suspended ${relativeTime(account.suspendedAt)}`
                    : undefined
            }
            className="bg-destructive-soft text-destructive inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-medium"
        >
            Suspended
        </span>
    );
}

function UsageBar({ account }: { account: Account }) {
    const unlimited = account.storageLimit === 0;
    const ratio = unlimited
        ? 0
        : Math.min(1, account.storageUsed / account.storageLimit);
    const tight = ratio > 0.9;

    return (
        <div className="flex min-w-[8rem] flex-col gap-1">
            <span className="whitespace-nowrap font-mono text-[11.5px]">
                {formatBytes(account.storageUsed)}
                <span className="text-muted-foreground">
                    {' / '}
                    {unlimited ? 'no limit' : formatBytes(account.storageLimit)}
                </span>
            </span>
            <span className="bg-muted h-[3px] w-full overflow-hidden rounded-full">
                <span
                    className={cn(
                        'block h-full rounded-full',
                        tight ? 'bg-destructive' : 'bg-foreground/40',
                    )}
                    style={{ width: `${Math.max(2, ratio * 100)}%` }}
                />
            </span>
        </div>
    );
}

const GB = 1024 ** 3;
/** 0 is unlimited, which is why it sits at the end rather than the start. */
const QUOTA_PRESETS = [1, 2, 5, 6, 10, 25, 50].map((gb) => gb * GB).concat(0);

function quotaLabel(bytes: number): string {
    return bytes === 0
        ? 'Unlimited'
        : `${Math.round((bytes / GB) * 10) / 10} GB`;
}

/**
 * Quota as a row-level control. Presets only — an account needing an arbitrary
 * number is a deliberate act, and that lives on the detail page with a text
 * field. Whatever the account already has is always in the list, so opening the
 * menu can never quietly offer to change something you did not ask about.
 */
function quotaOptions(current: number) {
    const values = QUOTA_PRESETS.includes(current)
        ? QUOTA_PRESETS
        : [...QUOTA_PRESETS.filter((v) => v !== 0), current]
              .sort((a, b) => a - b)
              .concat(0);

    return values.map((bytes) => ({
        value: String(bytes),
        label: quotaLabel(bytes),
    }));
}

type RoleFilter = 'any' | 'admin' | 'member';
type StatusFilter = 'any' | 'active' | 'suspended';
/** The questions an administrator actually opens this page to answer. */
type StorageFilter = 'any' | 'tight' | 'unlimited' | 'empty';

function matchesStorage(
    account: Account,
    filter: StorageFilter,
    shareCount: number,
): boolean {
    switch (filter) {
        case 'tight':
            return (
                account.storageLimit > 0 &&
                account.storageUsed / account.storageLimit > 0.9
            );
        case 'unlimited':
            return account.storageLimit === 0;
        case 'empty':
            return shareCount === 0;
        default:
            return true;
    }
}

/** A menu entry the guardrails have refused, which says so rather than vanishing. */
function GuardedItem({
    reason,
    children,
    onSelect,
    variant,
}: {
    reason: GuardReason | null;
    children: React.ReactNode;
    onSelect: () => void;
    variant?: 'destructive';
}) {
    if (!reason) {
        return (
            <DropdownMenuItem variant={variant} onSelect={onSelect}>
                {children}
            </DropdownMenuItem>
        );
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div>
                    <DropdownMenuItem
                        disabled
                        onSelect={(e) => e.preventDefault()}
                    >
                        {children}
                    </DropdownMenuItem>
                </div>
            </TooltipTrigger>
            <TooltipContent side="left">{GUARD_COPY[reason]}</TooltipContent>
        </Tooltip>
    );
}

function useUserActions() {
    const navigate = useNavigate();
    const guard = useDozo((s) => s.guardAccount);
    const setRole = useDozo((s) => s.setAccountRole);
    const setStatus = useDozo((s) => s.setAccountStatus);
    const remove = useDozo((s) => s.deleteUser);
    const viewAs = useDozo((s) => s.viewAs);
    const shares = useDozo((s) => s.shares);
    const { confirm, dialog } = useConfirm();

    const toggleRole = (account: Account) => {
        const next = account.role === 'admin' ? 'member' : 'admin';

        if (setRole(account.id, next)) {
            toast(
                `${account.name} is now ${next === 'admin' ? 'an administrator' : 'a member'}`,
            );
        }
    };

    const toggleStatus = (account: Account) => {
        const next = account.status === 'active' ? 'suspended' : 'active';

        if (setStatus(account.id, next)) {
            toast(
                next === 'suspended'
                    ? `${account.name} is suspended`
                    : `${account.name} is active again`,
            );
        }
    };

    const deleteOne = async (account: Account) => {
        const owned = shares.filter((s) => s.ownerId === account.id).length;
        const ok = await confirm({
            title: `Delete ${account.name}?`,
            description: (
                <>
                    {owned > 0 ? (
                        <>
                            <span className="text-foreground">{owned}</span>{' '}
                            {owned === 1 ? 'Share goes' : 'Shares go'} with the
                            account and their URLs stop resolving.{' '}
                        </>
                    ) : (
                        'The account owns nothing, so no URLs change. '
                    )}
                    There is no recovery path, not even for you.
                </>
            ),
            confirmLabel: 'Delete account',
        });

        if (ok && remove(account.id)) {
            toast(`${account.name} deleted`);
            navigate('/admin/users');
        }
    };

    const impersonate = (account: Account) => {
        viewAs(account.id);
        navigate('/');
    };

    /** The refusal as a sentence, for controls that explain themselves in place. */
    const guardCopy = (
        targetId: string,
        next: {
            role?: Account['role'];
            status?: AccountStatus;
            deleted?: boolean;
        },
    ) => {
        const reason = guard(targetId, next);

        return reason ? GUARD_COPY[reason] : null;
    };

    return {
        guard,
        guardCopy,
        toggleRole,
        toggleStatus,
        deleteOne,
        impersonate,
        dialog,
    };
}

export function AdminUsersRoute() {
    const accounts = useDozo((s) => s.accounts);
    const shares = useDozo((s) => s.shares);
    const {
        guard,
        guardCopy,
        toggleRole,
        toggleStatus,
        deleteOne,
        impersonate,
        dialog,
    } = useUserActions();

    const setQuota = useDozo((s) => s.setAccountQuota);

    const [query, setQuery] = useState('');
    const [roleOnly, setRoleOnly] = useState<RoleFilter>('any');
    const [statusOnly, setStatusOnly] = useState<StatusFilter>('any');
    const [storageOnly, setStorageOnly] = useState<StorageFilter>('any');
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'createdAt', desc: true },
    ]);
    const [selection, setSelection] = useState({});

    const counts = useMemo(() => countSharesByOwner(shares), [shares]);

    const data = useMemo(
        () =>
            Object.values(accounts).filter(
                (a) =>
                    (roleOnly === 'any' || a.role === roleOnly) &&
                    (statusOnly === 'any' || a.status === statusOnly) &&
                    matchesStorage(a, storageOnly, counts[a.id] ?? 0),
            ),
        [accounts, roleOnly, statusOnly, storageOnly, counts],
    );

    const columns = useMemo(() => {
        const col = createColumnHelper<Account>();

        return [
            col.display({
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        aria-label="Select everyone on this page"
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(v) =>
                            table.toggleAllPageRowsSelected(v === true)
                        }
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        aria-label={`Select ${row.original.name}`}
                        checked={row.getIsSelected()}
                        onCheckedChange={(v) => row.toggleSelected(v === true)}
                    />
                ),
                meta: { className: 'w-8' },
            }),
            col.accessor('name', {
                header: 'User',
                cell: ({ row }) => (
                    <Link
                        to={row.original.id}
                        className="group flex min-w-0 items-center gap-2.5"
                    >
                        <Avatar className="size-6 shrink-0 rounded-md">
                            <AvatarImage
                                src={row.original.avatarSrc}
                                alt=""
                                className="rounded-md"
                            />
                            <AvatarFallback className="rounded-md text-[10px]">
                                {row.original.name.slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                            <span className="block truncate text-[13px] font-medium group-hover:underline">
                                {row.original.name}
                            </span>
                            <span className="text-muted-foreground block truncate font-mono text-[11px]">
                                {row.original.email}
                            </span>
                        </span>
                    </Link>
                ),
            }),
            col.accessor('role', {
                header: 'Role',
                cell: ({ row }) => {
                    const account = row.original;

                    return (
                        <InlineSelect
                            label={`Role for ${account.name}`}
                            value={account.role}
                            onChange={(next) =>
                                next !== account.role && toggleRole(account)
                            }
                            disabledReason={guardCopy(account.id, {
                                role:
                                    account.role === 'admin'
                                        ? 'member'
                                        : 'admin',
                            })}
                            options={[
                                { value: 'member', label: 'Member' },
                                { value: 'admin', label: 'Admin' },
                            ]}
                        >
                            <RoleChip role={account.role} />
                        </InlineSelect>
                    );
                },
            }),
            col.accessor('status', {
                header: 'Status',
                cell: ({ row }) => {
                    const account = row.original;

                    return (
                        <InlineSelect
                            label={`Status for ${account.name}`}
                            value={account.status}
                            onChange={(next) =>
                                next !== account.status && toggleStatus(account)
                            }
                            disabledReason={guardCopy(account.id, {
                                status:
                                    account.status === 'active'
                                        ? 'suspended'
                                        : 'active',
                            })}
                            options={[
                                { value: 'active', label: 'Active' },
                                { value: 'suspended', label: 'Suspended' },
                            ]}
                        >
                            <StatusChip account={account} />
                        </InlineSelect>
                    );
                },
            }),
            // Sorts on the ratio, not the bytes: 1.99 of 2 GB matters more than 9 of 50.
            col.accessor(
                (a) =>
                    a.storageLimit === 0 ? 0 : a.storageUsed / a.storageLimit,
                {
                    id: 'usage',
                    header: 'Usage',
                    cell: ({ row }) => {
                        const account = row.original;

                        return (
                            <InlineSelect
                                label={`Quota for ${account.name}`}
                                value={String(account.storageLimit)}
                                options={quotaOptions(account.storageLimit)}
                                onChange={(next) => {
                                    setQuota(account.id, Number(next));
                                    toast(
                                        `Quota for ${account.name} set to ${quotaLabel(Number(next))}`,
                                    );
                                }}
                            >
                                <UsageBar account={account} />
                            </InlineSelect>
                        );
                    },
                },
            ),
            col.accessor((a) => counts[a.id] ?? 0, {
                id: 'shares',
                header: 'Shares',
                cell: (c) => (
                    <span className="font-mono text-[11.5px]">
                        {c.getValue<number>()}
                    </span>
                ),
                meta: { className: 'hidden lg:table-cell' },
            }),
            col.accessor('createdAt', {
                header: 'Joined',
                cell: (c) => (
                    <span className="text-muted-foreground whitespace-nowrap font-mono text-[11.5px]">
                        {relativeTime(c.getValue())}
                    </span>
                ),
                meta: { className: 'hidden lg:table-cell' },
            }),
            col.display({
                id: 'actions',
                header: '',
                cell: ({ row }) => {
                    const account = row.original;

                    return (
                        <div className="flex justify-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label={`Actions for ${account.name}`}
                                    >
                                        <DotsThree weight="bold" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-52"
                                >
                                    <DropdownMenuItem asChild>
                                        <Link to={account.id}>Open user</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onSelect={() => impersonate(account)}
                                    >
                                        <Eye /> View as
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <GuardedItem
                                        reason={guard(account.id, {
                                            role:
                                                account.role === 'admin'
                                                    ? 'member'
                                                    : 'admin',
                                        })}
                                        onSelect={() => toggleRole(account)}
                                    >
                                        <ShieldCheck />
                                        {account.role === 'admin'
                                            ? 'Make member'
                                            : 'Make administrator'}
                                    </GuardedItem>
                                    <GuardedItem
                                        reason={guard(account.id, {
                                            status:
                                                account.status === 'active'
                                                    ? 'suspended'
                                                    : 'active',
                                        })}
                                        onSelect={() => toggleStatus(account)}
                                    >
                                        <Prohibit />
                                        {account.status === 'active'
                                            ? 'Suspend'
                                            : 'Reactivate'}
                                    </GuardedItem>
                                    <DropdownMenuSeparator />
                                    <GuardedItem
                                        variant="destructive"
                                        reason={guard(account.id, {
                                            deleted: true,
                                        })}
                                        onSelect={() => void deleteOne(account)}
                                    >
                                        <Trash /> Delete account
                                    </GuardedItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                },
                meta: { className: 'w-10' },
            }),
        ];
    }, [
        counts,
        guard,
        guardCopy,
        toggleRole,
        toggleStatus,
        deleteOne,
        impersonate,
        setQuota,
    ]);

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

            return (
                row.original.name.toLowerCase().includes(needle) ||
                row.original.email.toLowerCase().includes(needle)
            );
        },
        initialState: { pagination: { pageSize: 10 } },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const narrowed =
        roleOnly !== 'any' ||
        statusOnly !== 'any' ||
        storageOnly !== 'any' ||
        query !== '';

    return (
        <>
            <DataTable
                table={table}
                unit="user"
                // The phone shape of a row. Identity leads, the three editable truths
                // sit under it on one line, and the meter spans the width where it can
                // actually be read — the same cells, re-stacked rather than reduced.
                card={(row) => {
                    const account = row.original;

                    return (
                        <div className="flex items-start gap-3">
                            <Checkbox
                                aria-label={`Select ${account.name}`}
                                className="mt-1.5 shrink-0"
                                checked={row.getIsSelected()}
                                onCheckedChange={(v) =>
                                    row.toggleSelected(v === true)
                                }
                            />
                            <div className="min-w-0 flex-1">
                                <Link
                                    to={account.id}
                                    className="flex min-w-0 items-center gap-2.5"
                                >
                                    <Avatar className="size-8 shrink-0 rounded-md">
                                        <AvatarImage
                                            src={account.avatarSrc}
                                            alt=""
                                            className="rounded-md"
                                        />
                                        <AvatarFallback className="rounded-md text-[11px]">
                                            {account.name.slice(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="min-w-0">
                                        <span className="block truncate text-[13.5px] font-medium">
                                            {account.name}
                                        </span>
                                        <span className="text-muted-foreground block truncate font-mono text-[11px]">
                                            {account.email}
                                        </span>
                                    </span>
                                </Link>

                                <div className="mt-2.5 flex flex-wrap items-center gap-x-1 gap-y-1.5">
                                    <InlineSelect
                                        label={`Role for ${account.name}`}
                                        value={account.role}
                                        onChange={(next) =>
                                            next !== account.role &&
                                            toggleRole(account)
                                        }
                                        disabledReason={guardCopy(account.id, {
                                            role:
                                                account.role === 'admin'
                                                    ? 'member'
                                                    : 'admin',
                                        })}
                                        options={[
                                            {
                                                value: 'member',
                                                label: 'Member',
                                            },
                                            { value: 'admin', label: 'Admin' },
                                        ]}
                                    >
                                        <RoleChip role={account.role} />
                                    </InlineSelect>
                                    <InlineSelect
                                        label={`Status for ${account.name}`}
                                        value={account.status}
                                        onChange={(next) =>
                                            next !== account.status &&
                                            toggleStatus(account)
                                        }
                                        disabledReason={guardCopy(account.id, {
                                            status:
                                                account.status === 'active'
                                                    ? 'suspended'
                                                    : 'active',
                                        })}
                                        options={[
                                            {
                                                value: 'active',
                                                label: 'Active',
                                            },
                                            {
                                                value: 'suspended',
                                                label: 'Suspended',
                                            },
                                        ]}
                                    >
                                        <StatusChip account={account} />
                                    </InlineSelect>
                                    <span className="text-muted-foreground font-mono text-[11px]">
                                        {counts[account.id] ?? 0} shares
                                    </span>
                                </div>

                                <div className="mt-2">
                                    <InlineSelect
                                        label={`Quota for ${account.name}`}
                                        value={String(account.storageLimit)}
                                        options={quotaOptions(
                                            account.storageLimit,
                                        )}
                                        onChange={(next) => {
                                            setQuota(account.id, Number(next));
                                            toast(
                                                `Quota for ${account.name} set to ${quotaLabel(Number(next))}`,
                                            );
                                        }}
                                    >
                                        <UsageBar account={account} />
                                    </InlineSelect>
                                </div>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className="shrink-0"
                                        aria-label={`Actions for ${account.name}`}
                                    >
                                        <DotsThree weight="bold" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-52"
                                >
                                    <DropdownMenuItem asChild>
                                        <Link to={account.id}>Open user</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onSelect={() => impersonate(account)}
                                    >
                                        <Eye /> View as
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <GuardedItem
                                        variant="destructive"
                                        reason={guard(account.id, {
                                            deleted: true,
                                        })}
                                        onSelect={() => void deleteOne(account)}
                                    >
                                        <Trash /> Delete account
                                    </GuardedItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                }}
                toolbar={
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                        <div className="relative min-w-0 flex-1">
                            <MagnifyingGlass className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search names and addresses"
                                aria-label="Search users"
                                className="pl-9"
                            />
                            {query && (
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Clear search"
                                    className="absolute right-1 top-1/2 -translate-y-1/2"
                                    onClick={() => setQuery('')}
                                >
                                    <X />
                                </Button>
                            )}
                        </div>
                        {/* Three questions rather than one list of mixed ones: a chip row
                that mixes roles with states makes "Admins" and "Suspended" look
                mutually exclusive when they are not. */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Select
                                value={roleOnly}
                                onValueChange={(v) =>
                                    setRoleOnly(v as RoleFilter)
                                }
                            >
                                <SelectTrigger
                                    aria-label="Filter by role"
                                    className="w-[8.5rem] text-[13px]"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    <SelectItem value="any">
                                        Any role
                                    </SelectItem>
                                    <SelectItem value="admin">
                                        Admins
                                    </SelectItem>
                                    <SelectItem value="member">
                                        Members
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={statusOnly}
                                onValueChange={(v) =>
                                    setStatusOnly(v as StatusFilter)
                                }
                            >
                                <SelectTrigger
                                    aria-label="Filter by status"
                                    className="w-[9rem] text-[13px]"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    <SelectItem value="any">
                                        Any status
                                    </SelectItem>
                                    <SelectItem value="active">
                                        Active
                                    </SelectItem>
                                    <SelectItem value="suspended">
                                        Suspended
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={storageOnly}
                                onValueChange={(v) =>
                                    setStorageOnly(v as StorageFilter)
                                }
                            >
                                <SelectTrigger
                                    aria-label="Filter by storage"
                                    className="w-[10rem] text-[13px]"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    <SelectItem value="any">
                                        Any storage
                                    </SelectItem>
                                    <SelectItem value="tight">
                                        Over 90%
                                    </SelectItem>
                                    <SelectItem value="unlimited">
                                        No quota
                                    </SelectItem>
                                    <SelectItem value="empty">
                                        Nothing shared
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {narrowed && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setRoleOnly('any');
                                        setStatusOnly('any');
                                        setStorageOnly('any');
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
                        <p className="text-[14px] font-medium">
                            No accounts match that
                        </p>
                        <p className="text-muted-foreground mx-auto mt-1.5 max-w-[42ch] text-[13px] leading-relaxed">
                            Try a shorter search, or clear the filters.
                        </p>
                    </>
                }
            />
            {dialog}
        </>
    );
}

export function AdminUserRoute() {
    const { accountId = '' } = useParams();
    const account = useDozo((s) => s.accounts[accountId]);
    const shares = useDozo((s) => s.shares);
    const setQuota = useDozo((s) => s.setAccountQuota);
    const recalc = useDozo((s) => s.recalcUsage);
    const endSession = useDozo((s) => s.endUserSession);
    const revokeToken = useDozo((s) => s.revokeUserToken);
    const { guard, toggleRole, toggleStatus, deleteOne, impersonate, dialog } =
        useUserActions();
    const [quotaGb, setQuotaGb] = useState('');

    const owned = useMemo(
        () => shares.filter((s) => s.ownerId === accountId),
        [shares, accountId],
    );
    const recent = useMemo(
        () => [...owned].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4),
        [owned],
    );
    const onDisk = useMemo(
        () => usageFromShares(shares, accountId),
        [shares, accountId],
    );

    if (!account) {
        return <Navigate to="/admin/users" replace />;
    }

    const drifted = Math.abs(account.storageUsed - onDisk) > 1024 * 1024;

    return (
        <>
            <div className="flex flex-col gap-6">
                <div>
                    <Link
                        to="/admin/users"
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-[12.5px] transition-colors"
                    >
                        <ArrowLeft className="size-3.5" /> All users
                    </Link>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <Avatar className="size-11 rounded-lg">
                            <AvatarImage
                                src={account.avatarSrc}
                                alt=""
                                className="rounded-lg"
                            />
                            <AvatarFallback className="rounded-lg">
                                {account.name.slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <h2 className="flex flex-wrap items-center gap-2 text-[16px] font-medium tracking-[-0.01em]">
                                {account.name}
                                <RoleChip role={account.role} />
                                <StatusChip account={account} />
                            </h2>
                            <p className="text-muted-foreground mt-0.5 font-mono text-[11.5px]">
                                {account.email} · joined{' '}
                                {formatDateTime(account.createdAt)}
                            </p>
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => impersonate(account)}
                            >
                                <Eye /> View as
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label="Account actions"
                                    >
                                        <DotsThree weight="bold" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-52"
                                >
                                    <GuardedItem
                                        reason={guard(account.id, {
                                            role:
                                                account.role === 'admin'
                                                    ? 'member'
                                                    : 'admin',
                                        })}
                                        onSelect={() => toggleRole(account)}
                                    >
                                        <ShieldCheck />
                                        {account.role === 'admin'
                                            ? 'Make member'
                                            : 'Make administrator'}
                                    </GuardedItem>
                                    <GuardedItem
                                        reason={guard(account.id, {
                                            status:
                                                account.status === 'active'
                                                    ? 'suspended'
                                                    : 'active',
                                        })}
                                        onSelect={() => toggleStatus(account)}
                                    >
                                        <Prohibit />
                                        {account.status === 'active'
                                            ? 'Suspend'
                                            : 'Reactivate'}
                                    </GuardedItem>
                                    <DropdownMenuSeparator />
                                    <GuardedItem
                                        variant="destructive"
                                        reason={guard(account.id, {
                                            deleted: true,
                                        })}
                                        onSelect={() => void deleteOne(account)}
                                    >
                                        <Trash /> Delete account
                                    </GuardedItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* Storage */}
                <section className="border-border bg-card rounded-xl border p-4">
                    <p className="label-mono">Storage</p>
                    <div className="mt-3 max-w-sm">
                        <UsageBar account={account} />
                    </div>
                    {drifted && (
                        <p className="text-muted-foreground mt-3 font-mono text-[11.5px]">
                            accounted {formatBytes(account.storageUsed)} ·
                            shares on disk {formatBytes(onDisk)}
                        </p>
                    )}
                    <div className="border-border mt-4 flex flex-wrap items-end gap-2 border-t pt-4">
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="quota"
                                className="text-[13px] font-normal"
                            >
                                Quota in GB
                            </label>
                            <Input
                                id="quota"
                                inputMode="decimal"
                                className="w-[9rem] font-mono"
                                placeholder={String(
                                    Math.round(
                                        (account.storageLimit / 1024 ** 3) * 10,
                                    ) / 10,
                                )}
                                value={quotaGb}
                                onChange={(e) => setQuotaGb(e.target.value)}
                            />
                        </div>
                        <Button
                            size="sm"
                            disabled={
                                quotaGb.trim() === '' ||
                                Number.isNaN(Number(quotaGb))
                            }
                            onClick={() => {
                                setQuota(
                                    account.id,
                                    Number(quotaGb) * 1024 ** 3,
                                );
                                setQuotaGb('');
                                toast(
                                    `Quota for ${account.name} set to ${quotaGb} GB`,
                                );
                            }}
                        >
                            Set quota
                        </Button>
                        {drifted && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    recalc(account.id);
                                    toast(
                                        'Storage recalculated from the shares on disk',
                                    );
                                }}
                            >
                                <ArrowsClockwise /> Recalculate
                            </Button>
                        )}
                    </div>
                </section>

                {/*
          Uploads live on their own page, with the same filters and views as the
          global table. What stays here is the shape of the pile and the four
          most recent, which is what the question "who is this account?" needs;
          reading their library is a different job and gets the room for it.
        */}
                <section>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <p className="label-mono">Uploads ({owned.length})</p>
                        {owned.length > 0 && (
                            <Link
                                to="uploads"
                                className="text-muted-foreground hover:text-foreground ml-auto inline-flex items-center gap-1 text-[12.5px] transition-colors"
                            >
                                Open all uploads{' '}
                                <ArrowRight className="size-3.5" />
                            </Link>
                        )}
                    </div>
                    {owned.length === 0 ? (
                        <p className="border-border text-muted-foreground mt-2.5 border-t pt-3 text-[13px]">
                            This account has never shared anything.
                        </p>
                    ) : (
                        <ul className="divide-border border-border mt-2.5 divide-y overflow-hidden rounded-lg border">
                            {recent.map((share) => (
                                <li
                                    key={share.id}
                                    className="flex items-center gap-3 px-3 py-2.5"
                                >
                                    <span className="text-muted-foreground shrink-0">
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
                                    </span>
                                    <Link
                                        to={sharePath(share)}
                                        className="min-w-0 flex-1 truncate text-[13px] hover:underline"
                                    >
                                        {shareLabel(share)}
                                    </Link>
                                    <span className="text-muted-foreground hidden font-mono text-[11px] sm:inline">
                                        {typeChip(share)}
                                    </span>
                                    <ExpiryLabel
                                        expiresAt={share.expiresAt}
                                        className="text-[11.5px]"
                                        prefix=""
                                    />
                                </li>
                            ))}
                            {owned.length > recent.length && (
                                <li className="px-3 py-2.5">
                                    <Link
                                        to="uploads"
                                        className="text-muted-foreground hover:text-foreground text-[12.5px]"
                                    >
                                        {owned.length - recent.length} more
                                    </Link>
                                </li>
                            )}
                        </ul>
                    )}
                </section>

                {/* Sessions */}
                <section>
                    <p className="label-mono">
                        Login sessions ({account.sessions.length})
                    </p>
                    {account.sessions.length === 0 ? (
                        <p className="border-border text-muted-foreground mt-2.5 border-t pt-3 text-[13px]">
                            Nobody is signed in on this account right now.
                        </p>
                    ) : (
                        <ul className="divide-border border-border mt-2.5 divide-y overflow-hidden rounded-lg border">
                            {account.sessions.map((session) => (
                                <li
                                    key={session.id}
                                    className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13px] font-medium">
                                            {session.device}
                                        </p>
                                        <p className="text-muted-foreground mt-0.5 font-mono text-[11px]">
                                            {session.browser} ·{' '}
                                            {session.location} ·{' '}
                                            {relativeTime(session.lastSeenAt)}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            endSession(account.id, session.id);
                                            toast(
                                                `Signed ${account.name} out of ${session.device}`,
                                            );
                                        }}
                                    >
                                        End session
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Tokens */}
                <section>
                    <p className="label-mono">
                        API tokens ({account.tokens.length})
                    </p>
                    {account.tokens.length === 0 ? (
                        <p className="border-border text-muted-foreground mt-2.5 border-t pt-3 text-[13px]">
                            This account has never created a token.
                        </p>
                    ) : (
                        <ul className="divide-border border-border mt-2.5 divide-y overflow-hidden rounded-lg border">
                            {account.tokens.map((token) => (
                                <li
                                    key={token.id}
                                    className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className={cn(
                                                'text-[13px] font-medium',
                                                token.revoked &&
                                                    'text-muted-foreground line-through',
                                            )}
                                        >
                                            {token.name}
                                        </p>
                                        <p className="text-muted-foreground mt-0.5 font-mono text-[11px]">
                                            created{' '}
                                            {formatDateTime(token.createdAt)} ·{' '}
                                            {token.revoked
                                                ? 'revoked'
                                                : token.lastUsedAt
                                                  ? `last used ${relativeTime(token.lastUsedAt)}`
                                                  : 'never used'}
                                        </p>
                                    </div>
                                    {!token.revoked && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                revokeToken(
                                                    account.id,
                                                    token.id,
                                                );
                                                toast(`Revoked ${token.name}`);
                                            }}
                                        >
                                            Revoke
                                        </Button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
            {dialog}
        </>
    );
}

/** Shared by the uploads route: is this share dead in some way? */
export function shareIsBroken(share: Share): boolean {
    return share.state === 'unavailable' || isShareExpired(share);
}
