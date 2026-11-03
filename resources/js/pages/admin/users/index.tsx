import { router } from '@inertiajs/react';
import {
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
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AdminLayout, AdminPageHead } from '@/components/admin-layout';
import {
    GuardedItem,
    RoleChip,
    StatusChip,
    UsageBar,
    useUserActions,
} from '@/components/admin-user-controls';
import { AppProviders } from '@/components/app-providers';
import { DataTable } from '@/components/data-table';
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
import { useNow } from '@/hooks/use-now';
import { initials, relativeTime } from '@/lib/format';
import { Link } from '@/lib/navigation';
import { countSharesByOwner } from '@/lib/share-display';
import type { Account, Share } from '@/lib/types';

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
function AdminUsersContent({
    accounts,
    shares,
}: {
    accounts: Account[];
    shares: Share[];
}) {
    const now = useNow(30_000);
    const {
        guard,
        guardCopy,
        toggleRole,
        toggleStatus,
        deleteOne,
        impersonate,
        dialog,
    } = useUserActions(accounts, shares);

    const setQuota = useCallback(
        (accountId: string, storageLimit: number) =>
            router.patch(
                `/admin/users/${accountId}`,
                { storage_limit: storageLimit },
                { preserveScroll: true },
            ),
        [],
    );

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
            accounts.filter(
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
                        to={`/admin/users/${row.original.id}`}
                        className="group flex min-w-0 items-center gap-3"
                    >
                        <Avatar className="size-9 shrink-0">
                            <AvatarImage src={row.original.avatarSrc} alt="" />
                            <AvatarFallback className="text-[12px]">
                                {initials(row.original.name)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                            <span className="block truncate font-bold group-hover:underline">
                                {row.original.name}
                            </span>
                            <span className="block truncate text-[13px] text-muted-foreground">
                                {row.original.email}
                            </span>
                        </span>
                    </Link>
                ),
                // Takes the remaining width and truncates: a table cell only clips
                // when its own width is pinned, which max-w-0 with w-full does.
                meta: { className: 'w-full max-w-0' },
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
                            <StatusChip account={account} now={now} />
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
                    <span className="font-bold tabular-nums">
                        {c.getValue<number>()}
                    </span>
                ),
                meta: { className: 'hidden lg:table-cell' },
            }),
            col.accessor('createdAt', {
                header: 'Joined',
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
                                        <Link to={`/admin/users/${account.id}`}>
                                            Open user
                                        </Link>
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
        now,
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

    const suspended = accounts.filter((a) => a.status === 'suspended').length;
    const admins = accounts.filter((a) => a.role === 'admin').length;

    return (
        <>
            <AdminPageHead
                title="Users"
                description={`${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'}, ${admins} ${admins === 1 ? 'administrator' : 'administrators'}${suspended > 0 ? `, ${suspended} suspended` : ''}.`}
            />
            <DataTable
                table={table}
                unit="user"
                // The phone shape of a row: identity on top, then the three
                // editable values (role, status, quota) on one line under it.
                card={(row) => {
                    const account = row.original;

                    return (
                        <div className="flex items-start gap-3">
                            <Checkbox
                                aria-label={`Select ${account.name}`}
                                className="mt-2 shrink-0"
                                checked={row.getIsSelected()}
                                onCheckedChange={(v) =>
                                    row.toggleSelected(v === true)
                                }
                            />
                            <div className="grid min-w-0 flex-1 gap-2">
                                <Link
                                    to={`/admin/users/${account.id}`}
                                    className="flex min-w-0 items-center gap-3"
                                >
                                    <Avatar className="size-9 shrink-0">
                                        <AvatarImage
                                            src={account.avatarSrc}
                                            alt=""
                                        />
                                        <AvatarFallback className="text-[12px]">
                                            {initials(account.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="min-w-0">
                                        <span className="block truncate font-bold">
                                            {account.name}
                                        </span>
                                        <span className="block truncate text-[13px] text-muted-foreground">
                                            {account.email} ·{' '}
                                            {counts[account.id] ?? 0} shares
                                        </span>
                                    </span>
                                </Link>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
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
                                        <StatusChip
                                            account={account}
                                            now={now}
                                        />
                                    </InlineSelect>
                                    <div className="basis-full">
                                        <InlineSelect
                                            label={`Quota for ${account.name}`}
                                            value={String(account.storageLimit)}
                                            options={quotaOptions(
                                                account.storageLimit,
                                            )}
                                            onChange={(next) => {
                                                setQuota(
                                                    account.id,
                                                    Number(next),
                                                );
                                                toast(
                                                    `Quota for ${account.name} set to ${quotaLabel(Number(next))}`,
                                                );
                                            }}
                                        >
                                            <UsageBar account={account} />
                                        </InlineSelect>
                                    </div>
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
                                        <Link to={`/admin/users/${account.id}`}>
                                            Open user
                                        </Link>
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
                    <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
                        <div className="relative min-w-0 flex-1">
                            <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
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
                                    className="absolute top-1/2 right-1 -translate-y-1/2"
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
                                    className="w-[8.5rem] max-sm:w-auto max-sm:min-w-[9rem] max-sm:flex-1"
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
                                    className="w-[9rem] max-sm:w-auto max-sm:min-w-[9rem] max-sm:flex-1"
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
                                    className="w-[10rem] max-sm:w-auto max-sm:min-w-[9rem] max-sm:flex-1"
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
                        <p className="text-[17px] font-bold">
                            No accounts match that
                        </p>
                        <p className="text-muted-foreground">
                            Try a shorter search, or clear the filters.
                        </p>
                    </>
                }
            />
            {dialog}
        </>
    );
}

export default function AdminUsersPage({
    accounts,
    shares,
}: {
    accounts: Account[];
    shares: Share[];
}) {
    return (
        <AppProviders>
            <AdminLayout>
                <AdminUsersContent accounts={accounts} shares={shares} />
            </AdminLayout>
        </AppProviders>
    );
}
