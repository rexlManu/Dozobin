import { router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/confirm-dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatBytes, relativeTime } from '@/lib/format';
import type { Account, AccountStatus, Share } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

type GuardReason = 'self' | 'last-admin' | 'missing';

const GUARD_COPY: Record<GuardReason, string> = {
    self: 'You cannot do this to your own account.',
    'last-admin': 'This is the last active administrator.',
    missing: 'That account no longer exists.',
};

export function RoleChip({ role }: { role: Account['role'] }) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] font-medium',
                role === 'admin'
                    ? 'border-transparent bg-foreground text-background'
                    : 'border-border text-muted-foreground',
            )}
        >
            {role === 'admin' ? 'Admin' : 'Member'}
        </span>
    );
}

export function StatusChip({ account }: { account: Account }) {
    if (account.status === 'active') {
        return (
            <span className="text-[12.5px] text-muted-foreground">Active</span>
        );
    }

    return (
        <span
            title={
                account.suspendedAt
                    ? `Suspended ${relativeTime(account.suspendedAt)}`
                    : undefined
            }
            className="inline-flex items-center rounded-sm bg-destructive-soft px-1.5 py-0.5 text-[11px] font-medium text-destructive"
        >
            Suspended
        </span>
    );
}

export function UsageBar({ account }: { account: Account }) {
    const unlimited = account.storageLimit === 0;
    const ratio = unlimited
        ? 0
        : Math.min(1, account.storageUsed / account.storageLimit);
    const tight = ratio > 0.9;

    return (
        <div className="flex min-w-[8rem] flex-col gap-1">
            <span className="font-mono text-[11.5px] whitespace-nowrap">
                {formatBytes(account.storageUsed)}
                <span className="text-muted-foreground">
                    {' / '}
                    {unlimited ? 'no limit' : formatBytes(account.storageLimit)}
                </span>
            </span>
            <span className="h-[3px] w-full overflow-hidden rounded-full bg-muted">
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

export function GuardedItem({
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

export function useUserActions(accounts: Account[], shares: Share[]) {
    const current = usePage<SharedPageProps>().props.auth.user;
    const { confirm, dialog } = useConfirm();

    const guard = (
        targetId: string,
        next: {
            role?: Account['role'];
            status?: AccountStatus;
            deleted?: boolean;
        },
    ): GuardReason | null => {
        const target = accounts.find((account) => account.id === targetId);

        if (!target) {
            return 'missing';
        }

        const locksOut =
            next.deleted === true ||
            next.role === 'member' ||
            next.status === 'suspended';

        if (current?.id === target.id && locksOut) {
            return 'self';
        }

        const activeAdmins = accounts.filter(
            (account) =>
                account.role === 'admin' && account.status === 'active',
        ).length;

        return target.role === 'admin' &&
            target.status === 'active' &&
            locksOut &&
            activeAdmins <= 1
            ? 'last-admin'
            : null;
    };

    const toggleRole = (account: Account) => {
        const next = account.role === 'admin' ? 'member' : 'admin';

        router.patch(
            `/admin/users/${account.id}`,
            { role: next },
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast(
                        `${account.name} is now ${next === 'admin' ? 'an administrator' : 'a member'}`,
                    ),
            },
        );
    };

    const toggleStatus = (account: Account) => {
        const next = account.status === 'active' ? 'suspended' : 'active';

        router.patch(
            `/admin/users/${account.id}`,
            { status: next },
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast(
                        next === 'suspended'
                            ? `${account.name} is suspended`
                            : `${account.name} is active again`,
                    ),
            },
        );
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

        if (ok) {
            router.delete(`/admin/users/${account.id}`, {
                onSuccess: () => toast(`${account.name} deleted`),
            });
        }
    };

    const impersonate = (account: Account) => {
        router.post(`/admin/users/${account.id}/impersonate`);
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
