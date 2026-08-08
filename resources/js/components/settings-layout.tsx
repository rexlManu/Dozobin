import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { NavLink } from '@/lib/navigation';
import { cn } from '@/lib/utils';

const SECTIONS = [
    { to: '/settings/profile', label: 'Profile' },
    { to: '/settings/appearance', label: 'Appearance' },
    { to: '/settings/sharing', label: 'Sharing defaults' },
    { to: '/settings/storage', label: 'Storage' },
    { to: '/settings/security', label: 'Security' },
    { to: '/settings/tokens', label: 'API tokens' },
    { to: '/settings/sharex', label: 'ShareX' },
];

export function SettingsPageHead({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
        <header>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
                {title}
            </h2>
            {description && (
                <p className="mt-1.5 max-w-[62ch] text-[13px] leading-relaxed text-muted-foreground">
                    {description}
                </p>
            )}
        </header>
    );
}

export function SettingsLayout({ children }: { children: ReactNode }) {
    return (
        <AppShell>
            <div className="rail py-6 sm:py-8">
                <h1 className="text-xl font-medium tracking-[-0.02em]">
                    Settings
                </h1>

                <div className="mt-6 grid gap-7 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10">
                    {/*
            The indicator is the header's own device turned on its side: a
            hairline the active item sits against, ink rather than yuzu, because
            the accent belongs to acts and never to navigation.
          */}
                    <nav className="-mx-4 flex scrollbar-slim gap-1 overflow-x-auto border-b border-border px-4 lg:sticky lg:top-20 lg:mx-0 lg:flex-col lg:gap-0.5 lg:self-start lg:overflow-visible lg:border-b-0 lg:border-l lg:px-0">
                        {SECTIONS.map((section) => (
                            <NavLink
                                key={section.to}
                                to={section.to}
                                className={({ isActive }) =>
                                    cn(
                                        'relative shrink-0 px-2.5 py-2 text-[13px] transition-colors lg:py-1.5',
                                        isActive
                                            ? 'font-medium text-foreground'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <span
                                                aria-hidden
                                                className="absolute inset-x-2 -bottom-px h-[1.5px] bg-foreground lg:inset-x-auto lg:inset-y-1 lg:-left-px lg:h-auto lg:w-[1.5px]"
                                            />
                                        )}
                                        {section.label}
                                    </>
                                )}
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
