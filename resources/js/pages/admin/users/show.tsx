import { router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    ArrowsClockwise,
    DotsThree,
    Eye,
    Prohibit,
    ShieldCheck,
    Trash,
} from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin-layout';
import {
    GuardedItem,
    RoleChip,
    StatusChip,
    UsageBar,
    useUserActions,
} from '@/components/admin-user-controls';
import { AppProviders } from '@/components/app-providers';
import { ExpiryLabel } from '@/components/expiry';
import { FileGlyph } from '@/components/file-glyph';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useNow } from '@/hooks/use-now';
import { formatBytes, formatDateTime, relativeTime } from '@/lib/format';
import { Link } from '@/lib/navigation';
import {
    shareLabel,
    sharePath,
    typeChip,
    usageFromShares,
} from '@/lib/share-display';
import type { Account, Share } from '@/lib/types';
import { cn } from '@/lib/utils';

function AdminUserContent({
    account,
    accounts,
    shares,
}: {
    account: Account;
    accounts: Account[];
    shares: Share[];
}) {
    const now = useNow(30_000);
    const { guard, toggleRole, toggleStatus, deleteOne, impersonate, dialog } =
        useUserActions(accounts, shares);
    const [quotaGb, setQuotaGb] = useState('');

    const owned = useMemo(
        () => shares.filter((share) => share.ownerId === account.id),
        [shares, account.id],
    );
    const recent = useMemo(
        () => [...owned].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4),
        [owned],
    );
    const onDisk = useMemo(
        () => usageFromShares(shares, account.id),
        [shares, account.id],
    );

    const drifted = Math.abs(account.storageUsed - onDisk) > 1024 * 1024;

    return (
        <>
            <div className="flex flex-col gap-6">
                <div>
                    <Link
                        to="/admin/users"
                        className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
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
                                <StatusChip account={account} now={now} />
                            </h2>
                            <p className="mt-0.5 font-mono text-[11.5px] text-muted-foreground">
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
                <section className="rounded-xl border border-border bg-card p-4">
                    <p className="label-mono">Storage</p>
                    <div className="mt-3 max-w-sm">
                        <UsageBar account={account} />
                    </div>
                    {drifted && (
                        <p className="mt-3 font-mono text-[11.5px] text-muted-foreground">
                            accounted {formatBytes(account.storageUsed)} ·
                            shares on disk {formatBytes(onDisk)}
                        </p>
                    )}
                    <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-4">
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
                                router.patch(
                                    `/admin/users/${account.id}`,
                                    {
                                        storage_limit:
                                            Number(quotaGb) * 1024 ** 3,
                                    },
                                    {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            setQuotaGb('');
                                            toast(
                                                `Quota for ${account.name} set to ${quotaGb} GB`,
                                            );
                                        },
                                    },
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
                                    router.reload({
                                        only: ['account', 'shares'],
                                        onSuccess: () =>
                                            toast(
                                                'Storage recalculated from the shares on disk',
                                            ),
                                    });
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
                                to={`/admin/users/${account.id}/uploads`}
                                className="ml-auto inline-flex items-center gap-1 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
                            >
                                Open all uploads{' '}
                                <ArrowRight className="size-3.5" />
                            </Link>
                        )}
                    </div>
                    {owned.length === 0 ? (
                        <p className="mt-2.5 border-t border-border pt-3 text-[13px] text-muted-foreground">
                            This account has never shared anything.
                        </p>
                    ) : (
                        <ul className="mt-2.5 divide-y divide-border overflow-hidden rounded-lg border border-border">
                            {recent.map((share) => (
                                <li
                                    key={share.id}
                                    className="flex items-center gap-3 px-3 py-2.5"
                                >
                                    <span className="shrink-0 text-muted-foreground">
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
                                    <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
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
                                        to={`/admin/users/${account.id}/uploads`}
                                        className="text-[12.5px] text-muted-foreground hover:text-foreground"
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
                        <p className="mt-2.5 border-t border-border pt-3 text-[13px] text-muted-foreground">
                            Nobody is signed in on this account right now.
                        </p>
                    ) : (
                        <ul className="mt-2.5 divide-y divide-border overflow-hidden rounded-lg border border-border">
                            {account.sessions.map((session) => (
                                <li
                                    key={session.id}
                                    className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13px] font-medium">
                                            {session.device}
                                        </p>
                                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                                            {session.browser} ·{' '}
                                            {session.location} ·{' '}
                                            {relativeTime(
                                                session.lastSeenAt,
                                                now,
                                            )}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            router.delete(
                                                `/admin/users/${account.id}/sessions/${session.id}`,
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () =>
                                                        toast(
                                                            `Signed ${account.name} out of ${session.device}`,
                                                        ),
                                                },
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
                        <p className="mt-2.5 border-t border-border pt-3 text-[13px] text-muted-foreground">
                            This account has never created a token.
                        </p>
                    ) : (
                        <ul className="mt-2.5 divide-y divide-border overflow-hidden rounded-lg border border-border">
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
                                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                                            created{' '}
                                            {formatDateTime(token.createdAt)} ·{' '}
                                            {token.revoked
                                                ? 'revoked'
                                                : token.lastUsedAt
                                                  ? `last used ${relativeTime(token.lastUsedAt, now)}`
                                                  : 'never used'}
                                        </p>
                                    </div>
                                    {!token.revoked && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                router.delete(
                                                    `/api-tokens/${token.id}`,
                                                    {
                                                        preserveScroll: true,
                                                        onSuccess: () =>
                                                            toast(
                                                                `Revoked ${token.name}`,
                                                            ),
                                                    },
                                                );
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

export default function AdminUserPage({
    account,
    accounts,
    shares,
}: {
    account: Account;
    accounts: Account[];
    shares: Share[];
}) {
    return (
        <AppProviders>
            <AdminLayout>
                <AdminUserContent
                    account={account}
                    accounts={accounts}
                    shares={shares}
                />
            </AdminLayout>
        </AppProviders>
    );
}
