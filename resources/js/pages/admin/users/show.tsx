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
import { AdminCard, AdminLayout, Tag } from '@/components/admin-layout';
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
import {
    formatBytes,
    formatDateTime,
    initials,
    relativeTime,
} from '@/lib/format';
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
            <div className="flex flex-col gap-7">
                <div>
                    <Link
                        to="/admin/users"
                        className="inline-flex items-center gap-1.5 text-[14px] font-bold text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" /> All users
                    </Link>

                    <div className="mt-4 flex flex-wrap items-center gap-4">
                        <Avatar className="size-14">
                            <AvatarImage src={account.avatarSrc} alt="" />
                            <AvatarFallback className="text-[16px]">
                                {initials(account.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-[22px] leading-tight font-bold break-words">
                                {account.name}
                            </h2>
                            <p className="mt-0.5 text-[14px] text-muted-foreground">
                                <span className="break-all">
                                    {account.email}
                                </span>{' '}
                                ·{' '}
                                <span className="whitespace-nowrap">
                                    joined {formatDateTime(account.createdAt)}
                                </span>
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                <RoleChip role={account.role} />
                                <StatusChip account={account} now={now} />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 max-sm:w-full">
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

                <AdminCard className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
                    <div className="min-w-0 flex-1 basis-60">
                        <h3 className="text-[17px] font-bold">Storage</h3>
                        <div className="mt-3 max-w-sm">
                            <UsageBar account={account} />
                        </div>
                        {drifted && (
                            <p className="mt-3 text-[13px] text-muted-foreground">
                                Counted {formatBytes(account.storageUsed)},
                                shares on disk {formatBytes(onDisk)}.
                            </p>
                        )}
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="quota" className="label-meta">
                                Quota in GB
                            </label>
                            <Input
                                id="quota"
                                inputMode="decimal"
                                className="w-[9rem]"
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
                </AdminCard>

                {/*
                  Uploads have their own page with the full filters. Here we show
                  the four most recent, which is enough to answer "who is this?".
                */}
                <Section
                    title="Uploads"
                    count={owned.length}
                    action={
                        owned.length > 0 && (
                            <Link
                                to={`/admin/users/${account.id}/uploads`}
                                className="inline-flex items-center gap-1 text-[14px] font-bold text-lavender hover:underline"
                            >
                                All uploads <ArrowRight className="size-4" />
                            </Link>
                        )
                    }
                    empty={
                        owned.length === 0 &&
                        'This account has never shared anything.'
                    }
                >
                    {recent.map((share) => (
                        <li
                            key={share.id}
                            className="flex items-center gap-3 rounded-[20px] bg-card px-3.5 py-2.5"
                        >
                            <span className="grid size-10 shrink-0 place-items-center rounded-[14px_16px_12px_18px] bg-sunken text-lavender">
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
                                    className="size-5"
                                />
                            </span>
                            <span className="grid min-w-0 flex-1">
                                <Link
                                    to={sharePath(share)}
                                    className="truncate font-bold hover:underline"
                                >
                                    {shareLabel(share)}
                                </Link>
                                <span className="text-[13px] text-muted-foreground">
                                    {typeChip(share)}
                                </span>
                            </span>
                            <ExpiryLabel
                                expiresAt={share.expiresAt}
                                className="shrink-0 text-[13px]"
                                prefix=""
                            />
                        </li>
                    ))}
                    {owned.length > recent.length && (
                        <li className="px-3.5 py-1">
                            <Link
                                to={`/admin/users/${account.id}/uploads`}
                                className="text-[14px] font-bold text-muted-foreground hover:text-foreground"
                            >
                                {owned.length - recent.length} more
                            </Link>
                        </li>
                    )}
                </Section>

                <Section
                    title="Login sessions"
                    count={account.sessions.length}
                    empty={
                        account.sessions.length === 0 &&
                        'Nobody is signed in on this account right now.'
                    }
                >
                    {account.sessions.map((session) => (
                        <li
                            key={session.id}
                            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[20px] bg-card px-4 py-3"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="font-bold">{session.device}</p>
                                <p className="text-[13px] text-muted-foreground">
                                    {session.browser} · {session.location} ·{' '}
                                    {relativeTime(session.lastSeenAt, now)}
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
                </Section>

                <Section
                    title="API tokens"
                    count={account.tokens.length}
                    empty={
                        account.tokens.length === 0 &&
                        'This account has never created a token.'
                    }
                >
                    {account.tokens.map((token) => (
                        <li
                            key={token.id}
                            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[20px] bg-card px-4 py-3"
                        >
                            <div className="min-w-0 flex-1">
                                <p
                                    className={cn(
                                        'flex flex-wrap items-center gap-2 font-bold',
                                        token.revoked &&
                                            'text-muted-foreground',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'break-all',
                                            token.revoked && 'line-through',
                                        )}
                                    >
                                        {token.name}
                                    </span>
                                    {token.revoked && (
                                        <Tag tone="muted">Revoked</Tag>
                                    )}
                                </p>
                                <p className="text-[13px] text-muted-foreground">
                                    created {formatDateTime(token.createdAt)} ·{' '}
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
                </Section>
            </div>
            {dialog}
        </>
    );
}

/** A titled list of soft rows, or one quiet line when there is nothing to list. */
function Section({
    title,
    count,
    action,
    empty,
    children,
}: {
    title: string;
    count: number;
    action?: React.ReactNode;
    empty: string | false;
    children: React.ReactNode;
}) {
    return (
        <section>
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-[17px] font-bold">
                    {title}{' '}
                    <span className="text-muted-foreground tabular-nums">
                        {count}
                    </span>
                </h3>
                {action && <div className="ml-auto">{action}</div>}
            </div>
            {empty ? (
                <p className="rounded-[20px] bg-card px-4 py-3.5 text-muted-foreground">
                    {empty}
                </p>
            ) : (
                <ul className="flex flex-col gap-2">{children}</ul>
            )}
        </section>
    );
}

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
