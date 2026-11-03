import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { NavLink } from '@/lib/navigation';
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

export function SettingsLayout({ children }: { children: ReactNode }) {
    const pathname = usePage().url.split('?')[0];

    return (
        <AppShell>
            <div className="rail py-6 sm:py-10">
                <h1 className="text-[28px] leading-tight font-bold">
                    Settings
                </h1>

                <div className="mt-5 grid gap-5 lg:mt-7 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
                    <nav
                        aria-label="Settings"
                        className="flex flex-wrap gap-1.5 lg:sticky lg:top-24 lg:flex-col lg:flex-nowrap lg:gap-1 lg:self-start"
                    >
                        {SECTIONS.map((section) => (
                            <NavLink
                                key={section.to}
                                to={section.to}
                                aria-current={
                                    pathname === section.to ? 'page' : undefined
                                }
                                className={({ isActive }) =>
                                    cn(
                                        'rounded-[14px] px-3.5 py-2 font-bold whitespace-nowrap transition-colors',
                                        isActive
                                            ? 'bg-lavender text-night'
                                            : 'text-muted-foreground hover:bg-sunken hover:text-foreground',
                                    )
                                }
                            >
                                {section.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="flex min-w-0 flex-col gap-5">
                        {children}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
