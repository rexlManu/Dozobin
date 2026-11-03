import { router, usePage } from '@inertiajs/react';
import { ArrowUpRight, X } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/navigation';
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
    {
        to: '/admin/settings/access',
        match: '/admin/settings',
        label: 'Settings',
    },
];

const SETTINGS_NAV = [
    { to: '/admin/settings/access', label: 'Access' },
    { to: '/admin/settings/expiration', label: 'Expiration' },
    { to: '/admin/settings/limits', label: 'Limits' },
    { to: '/admin/settings/file-types', label: 'File types' },
    { to: '/admin/settings/transfer', label: 'Transfer sessions' },
    { to: '/admin/settings/housekeeping', label: 'Housekeeping' },
    { to: '/admin/settings/system', label: 'System' },
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

function isUnder(path: string, prefix: string): boolean {
    return path === prefix || path.startsWith(`${prefix}/`);
}

/**
 * A row of pills that scrolls sideways when it does not fit, with the active
 * pill scrolled into view on load so a phone shows where you are.
 */
function PillRow({
    label,
    items,
    path,
    track = false,
}: {
    label: string;
    items: { to: string; match?: string; label: string }[];
    path: string;
    /** Draw the row as a segment track, for the settings tabs under the main pills. */
    track?: boolean;
}) {
    const row = useRef<HTMLElement>(null);

    useEffect(() => {
        const element = row.current;
        const active = element?.querySelector('[aria-current="page"]');

        if (!element || !active || element.scrollWidth <= element.clientWidth) {
            return;
        }

        const box = active.getBoundingClientRect();
        const frame = element.getBoundingClientRect();
        element.scrollLeft += box.left - frame.left - 16;
    }, []);

    return (
        <nav
            ref={row}
            aria-label={label}
            className="-mx-4 scrollbar-slim overflow-x-auto px-4 sm:mx-0 sm:px-0"
        >
            <div
                className={cn(
                    'flex w-max gap-1',
                    track && 'rounded-[16px] bg-sunken p-1',
                )}
            >
                {items.map((item) => {
                    const active = isUnder(path, item.match ?? item.to);

                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'shrink-0 font-bold whitespace-nowrap transition-colors',
                                track
                                    ? 'rounded-[12px] px-3.5 py-1.5 text-[14px]'
                                    : 'rounded-[14px] px-3.5 py-2 text-[15px]',
                                active
                                    ? track
                                        ? 'bg-lavender text-night'
                                        : 'bg-foreground text-night'
                                    : 'text-muted-foreground hover:text-foreground',
                                !active && !track && 'hover:bg-sunken',
                            )}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </div>
        </nav>
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
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[20px] bg-lavender-soft py-2.5 pr-2.5 pl-4">
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
 * Frame for every admin page: the title, the update notice, the section pills
 * and, on settings pages, a second row of settings tabs. The nav sits on top
 * rather than in a sidebar so wide tables get the full rail.
 */
export function AdminLayout({ children }: { children: ReactNode }) {
    const path = usePage().url.split('?')[0];
    const inSettings = isUnder(path, '/admin/settings');

    return (
        <AppShell>
            <div className="rail py-6 sm:py-8">
                <h1 className="text-[28px] leading-tight font-bold">
                    Administration
                </h1>

                <UpdateNotice />

                <div className="mt-4 grid gap-2.5">
                    <PillRow label="Administration" items={NAV} path={path} />
                    {inSettings && (
                        <PillRow
                            label="Settings"
                            items={SETTINGS_NAV}
                            path={path}
                            track
                        />
                    )}
                </div>

                <div className="mt-7 flex min-w-0 flex-col gap-5">
                    {children}
                </div>
            </div>
        </AppShell>
    );
}
