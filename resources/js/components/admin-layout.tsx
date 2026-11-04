import { router, usePage } from '@inertiajs/react';
import { ArrowUpRight, X } from '@phosphor-icons/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { PillNav } from '@/components/pill-nav';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

/** Top-level sections. `match` is the path prefix that marks the pill active. */
const NAV = [
    { to: '/admin/users', match: '/admin/users', label: 'Users' },
    { to: '/admin/invites', match: '/admin/invites', label: 'Invites' },
    { to: '/admin/uploads', match: '/admin/uploads', label: 'Uploads' },
    // "Sessions" rather than "Transfer sessions", because Settings already has
    // a tab by that name. The page's own heading says the full thing.
    { to: '/admin/sessions', match: '/admin/sessions', label: 'Sessions' },
    { to: '/admin/reports', match: '/admin/reports', label: 'Reports' },
    {
        to: '/admin/settings/access',
        match: '/admin/settings',
        label: 'Settings',
    },
];

export type TagTone = 'mint' | 'lavender' | 'lamp' | 'danger' | 'muted';

const TAG_TONE: Record<TagTone, string> = {
    mint: 'bg-mint-soft text-mint',
    lavender: 'bg-lavender-soft text-lavender',
    lamp: 'bg-warn-soft text-lamp',
    danger: 'bg-destructive-soft text-destructive',
    muted: 'bg-sunken text-muted-foreground',
};

/**
 * A status said in a word on a tinted fill, so state never rests on color
 * alone. Used by every admin table: account status, invite state, scans.
 */
export function Tag({
    tone,
    title,
    className,
    children,
}: {
    tone: TagTone;
    title?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <span
            title={title}
            className={cn(
                'inline-flex items-center gap-1 rounded-[10px] px-2.5 py-0.5 text-[13px] font-bold whitespace-nowrap',
                TAG_TONE[tone],
                className,
            )}
        >
            {children}
        </span>
    );
}

/** A soft meter for "used of allowed": quota on users, uses on invites. */
export function Meter({ ratio, full }: { ratio: number; full: boolean }) {
    return (
        <span className="block h-2 w-full overflow-hidden rounded-full bg-sunken">
            <span
                className={cn(
                    'block h-full rounded-full',
                    full ? 'bg-destructive' : 'bg-lamp',
                )}
                style={{ width: `${Math.max(3, ratio * 100)}%` }}
            />
        </span>
    );
}

/** The bold heading at the top of each admin page, with an optional action on the right. */
export function AdminPageHead({
    title,
    description,
    action,
}: {
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
}) {
    return (
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
            <div className="min-w-0">
                <h2 className="text-[22px] font-bold">{title}</h2>
                {description && (
                    <p className="mt-1 max-w-[62ch] text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </header>
    );
}

/** The panel that holds a form or a block of facts. */
export function AdminCard({
    className,
    children,
}: {
    className?: string;
    children: ReactNode;
}) {
    return (
        <section
            className={cn(
                'rounded-[28px] border-[1.5px] border-border bg-card p-5 sm:p-[26px]',
                className,
            )}
        >
            {children}
        </section>
    );
}

function UpdateNotice() {
    const update = usePage<SharedPageProps>().props.update;
    const [dismissing, setDismissing] = useState(false);

    if (
        update === null ||
        !update.updateAvailable ||
        update.dismissed ||
        update.latestVersion === null ||
        update.releaseUrl === null
    ) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[20px] bg-lavender-soft py-2.5 pr-2.5 pl-4">
            <ArrowUpRight
                aria-hidden
                weight="bold"
                className="size-4 shrink-0 text-lavender"
            />
            <p className="min-w-0">
                <span className="font-bold">
                    Dōzobin {update.latestVersion} is out.
                </span>{' '}
                <span className="text-muted-foreground">
                    This server runs {update.currentVersion}.
                </span>
            </p>
            <a
                href={update.releaseUrl}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-lavender underline underline-offset-4"
            >
                View release
            </a>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={dismissing}
                className="ml-auto"
                aria-label={`Dismiss the ${update.latestVersion} update notice`}
                onClick={() => {
                    setDismissing(true);
                    router.post(
                        '/admin/update-notice/dismiss',
                        { version: update.latestVersion },
                        {
                            preserveScroll: true,
                            onFinish: () => setDismissing(false),
                        },
                    );
                }}
            >
                <X aria-hidden />
            </Button>
        </div>
    );
}

/**
 * Frame for every admin page: the title and section pills in the sky, then
 * the update notice. The nav sits on top rather than in a sidebar so wide
 * tables get the full rail. Settings pages add their own menu
 * (`AdminSettingsFrame`).
 */
export function AdminLayout({ children }: { children: ReactNode }) {
    const path = usePage().url.split('?')[0];
    const openReports = usePage<SharedPageProps>().props.openReports;

    return (
        <AppShell
            head={
                <div className="grid gap-4">
                    <h1 className="text-[32px] leading-tight font-bold sm:text-[44px]">
                        Administration
                    </h1>
                    <PillNav
                        label="Administration"
                        items={NAV.map((item) =>
                            item.to === '/admin/reports'
                                ? { ...item, badge: openReports ?? 0 }
                                : item,
                        )}
                        path={path}
                    />
                </div>
            }
        >
            <div className="rail grid gap-5 pb-10">
                <UpdateNotice />

                <div className="flex min-w-0 flex-col gap-5">{children}</div>
            </div>
        </AppShell>
    );
}
