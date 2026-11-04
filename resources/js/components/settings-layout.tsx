import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { PillNav } from '@/components/pill-nav';
import { cn } from '@/lib/utils';

// Yoru has one theme, so Appearance is left out of the nav. Its page and route
// still exist until the owner decides whether to remove them.
const SECTIONS = [
    { to: '/settings/profile', label: 'Profile' },
    { to: '/settings/sharing', label: 'Sharing defaults' },
    { to: '/settings/storage', label: 'Storage' },
    { to: '/settings/security', label: 'Security' },
    { to: '/settings/tokens', label: 'API tokens' },
    { to: '/settings/sharex', label: 'ShareX' },
];

/** Bold heading with an optional short explanation, used at the top of a settings card. */
export function SettingsPageHead({
    title,
    description,
    className,
}: {
    title: string;
    description?: string;
    className?: string;
}) {
    return (
        <header className={className}>
            <h2 className="text-[22px] leading-tight font-bold">{title}</h2>
            {description && (
                <p className="mt-1.5 max-w-[62ch] text-muted-foreground">
                    {description}
                </p>
            )}
        </header>
    );
}

/**
 * One soft settings card: a bold title, an optional explanation and the
 * controls below. `danger` tints the card for destructive actions.
 */
export function SettingsCard({
    title,
    description,
    danger = false,
    children,
}: {
    title: string;
    description?: string;
    danger?: boolean;
    children: ReactNode;
}) {
    return (
        <section
            className={cn(
                'grid gap-5 rounded-[26px] border-[1.5px] bg-card p-[18px] sm:p-[26px]',
                danger ? 'border-destructive/40' : 'border-border',
            )}
        >
            <header>
                <h2
                    className={cn(
                        'text-[20px] leading-tight font-bold',
                        danger && 'text-destructive',
                    )}
                >
                    {title}
                </h2>
                {description && (
                    <p className="mt-1.5 max-w-[62ch] text-muted-foreground">
                        {description}
                    </p>
                )}
            </header>
            {children}
        </section>
    );
}

/**
 * Frame for every settings page: the title and section pills in the sky, the
 * same way Administration does it, then the page's cards on the full rail.
 */
export function SettingsLayout({ children }: { children: ReactNode }) {
    const path = usePage().url.split('?')[0];

    return (
        <AppShell
            head={
                <div className="grid gap-4">
                    <h1 className="text-[32px] leading-tight font-bold sm:text-[44px]">
                        Settings
                    </h1>
                    <PillNav label="Settings" items={SECTIONS} path={path} />
                </div>
            }
        >
            <div className="rail flex min-w-0 flex-col gap-5 pb-10">
                {children}
            </div>
        </AppShell>
    );
}
