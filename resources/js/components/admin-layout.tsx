import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { NavLink } from '@/lib/navigation';
import { cn } from '@/lib/utils';

const NAV = [
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/invites', label: 'Invites' },
    { to: '/admin/uploads', label: 'Uploads' },
    // "Sessions" rather than "Transfer sessions", because Site settings already
    // has an item by that name and two identical labels in one sidebar is a
    // coin toss. The page's own heading says the full thing.
    { to: '/admin/sessions', label: 'Sessions' },
];

const SETTINGS_NAV = [
    { to: '/admin/settings/access', label: 'Access' },
    { to: '/admin/settings/expiration', label: 'Expiration' },
    { to: '/admin/settings/limits', label: 'Limits' },
    { to: '/admin/settings/file-types', label: 'File types' },
    { to: '/admin/settings/transfer', label: 'Transfer sessions' },
    { to: '/admin/settings/housekeeping', label: 'Housekeeping' },
];

function NavItem({ to, label }: { to: string; label: string }) {
    return (
        <NavLink
            to={to}
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
                    {label}
                </>
            )}
        </NavLink>
    );
}

export function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <AppShell>
            <div className="rail py-6 sm:py-8">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h1 className="text-xl font-medium tracking-[-0.02em]">
                        Administration
                    </h1>
                    <p className="font-mono text-[11.5px] text-muted-foreground">
                        applies to everyone on this server
                    </p>
                </div>

                <div className="mt-6 grid gap-7 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
                    <nav className="-mx-4 flex scrollbar-slim gap-1 overflow-x-auto border-b border-border px-4 lg:sticky lg:top-20 lg:mx-0 lg:flex-col lg:gap-0.5 lg:self-start lg:overflow-visible lg:border-b-0 lg:border-l lg:px-0">
                        {NAV.map((item) => (
                            <NavItem key={item.to} {...item} />
                        ))}
                        <span aria-hidden className="hidden h-3 lg:block" />
                        <p className="label-mono shrink-0 self-center px-2.5 py-2 lg:self-start lg:py-1">
                            Site settings
                        </p>
                        {SETTINGS_NAV.map((item) => (
                            <NavItem key={item.to} {...item} />
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
