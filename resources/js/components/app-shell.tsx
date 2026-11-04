import { router, usePage } from '@inertiajs/react';
import {
    ArrowsLeftRight,
    Eye,
    Gear,
    SignOut,
    Stack,
    UploadSimple,
    Wrench,
} from '@phosphor-icons/react';
import { Wordmark } from '@/components/brand';
import { NightCity, NightSky } from '@/components/night-sky';
import { SiteFooter } from '@/components/site-footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useScrolled } from '@/hooks/use-scrolled';
import { initials } from '@/lib/format';
import { Link, NavLink, useLocation, useNavigate } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

interface NavItem {
    to: string;
    label: string;
    icon: React.ComponentType<{
        className?: string;
        weight?: 'regular' | 'fill';
    }>;
}

function navItems(role: 'guest' | 'member' | 'admin'): NavItem[] {
    const items: NavItem[] = [{ to: '/', label: 'Send', icon: UploadSimple }];

    if (role !== 'guest') {
        items.push({ to: '/library', label: 'Library', icon: Stack });
    }

    items.push({ to: '/transfer', label: 'Transfer', icon: ArrowsLeftRight });

    if (role === 'admin') {
        items.push({ to: '/admin', label: 'Admin', icon: Wrench });
    }

    return items;
}

function AccountMenu() {
    const account = usePage<SharedPageProps>().props.auth.user;
    const navigate = useNavigate();

    if (!account) {
        return (
            // One bordered control, one plain link. Two buttons side by side was half
            // the reason the header read as a row of loose chips.
            <div className="flex items-center gap-3.5">
                <Link
                    to="/register"
                    className="hidden text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
                >
                    Create account
                </Link>
                <Button variant="outline" size="sm" asChild>
                    <Link to="/signin">Sign in</Link>
                </Button>
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-2 rounded-[14px] bg-white/8 py-1 pr-3.5 pl-1 font-bold transition-colors hover:bg-white/12 aria-expanded:bg-white/12"
                >
                    <Avatar className="size-7">
                        <AvatarImage src={account.avatarSrc} alt="" />
                        <AvatarFallback className="text-[11px]">
                            {initials(account.name)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-[14px] sm:inline">
                        {account.name.split(' ')[0]}
                    </span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-72">
                <div className="flex items-center gap-3 px-2.5 pt-2 pb-2.5">
                    <Avatar className="size-11">
                        <AvatarImage src={account.avatarSrc} alt="" />
                        <AvatarFallback className="text-[14px]">
                            {initials(account.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{account.name}</p>
                        <p className="truncate text-[13px] text-muted-foreground">
                            {account.email}
                        </p>
                    </div>
                    {account.role === 'admin' && (
                        <span className="rounded-[9px] bg-lavender-soft px-2 py-0.5 text-[12px] font-bold text-lavender">
                            Admin
                        </span>
                    )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate('/library')}>
                    <Stack /> Library
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/settings')}>
                    <Gear /> Settings
                </DropdownMenuItem>
                {account.role === 'admin' && (
                    <DropdownMenuItem onSelect={() => navigate('/admin')}>
                        <Wrench /> Administration
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-muted-foreground"
                    onSelect={() => {
                        router.post('/logout');
                    }}
                >
                    <SignOut /> Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * Sits in flow rather than fixed, so it works on canvas routes too. Quiet on
 * purpose: it is on screen everywhere at once, and the accent belongs to the
 * one act a page is for.
 */
function ImpersonationBanner() {
    const { user: viewing, impersonator } =
        usePage<SharedPageProps>().props.auth;

    if (!impersonator || !viewing) {
        return null;
    }

    return (
        <div className="relative z-40 shrink-0 bg-sunken">
            <div className="rail flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2">
                <Eye
                    weight="fill"
                    className="size-4 shrink-0 text-muted-foreground"
                />
                <p className="text-[13px]">
                    Viewing as{' '}
                    <span className="font-medium">{viewing.name}</span>
                </p>
                <p className="text-[12px] text-muted-foreground">
                    actions are applied as this account
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={() => {
                        router.delete('/impersonation');
                    }}
                >
                    Return to {impersonator.name.split(' ')[0]}
                </Button>
            </div>
        </div>
    );
}

/**
 * The frame of every page. A night sky of one fixed height sits behind the top
 * of the page, so switching pages never moves it. `head` (the page title)
 * sits inside the sky, above the rooftops; the page body always starts where
 * the rooftops meet the ground.
 */
export function AppShell({
    children,
    variant = 'app',
    head,
    headerExtra,
}: {
    children: React.ReactNode;
    variant?: 'app' | 'public';
    /** The page title block, drawn in the sky. */
    head?: React.ReactNode;
    /** Route-level controls that belong in the header rather than on the page. */
    headerExtra?: React.ReactNode;
}) {
    const account = usePage<SharedPageProps>().props.auth.user;
    const role = account?.role ?? 'guest';
    const { pathname } = useLocation();
    const items = navItems(role);
    const showNav = variant === 'app';
    const scrolled = useScrolled();

    return (
        <div className="relative isolate flex min-h-[100dvh] flex-col">
            <NightSky />

            <header
                className={cn(
                    'sticky top-0 z-30 -mb-16 transition-colors duration-200',
                    scrolled && 'bg-background/85 backdrop-blur-md',
                )}
            >
                <ImpersonationBanner />
                <div className="rail-wide flex h-16 items-center gap-5">
                    <Link to="/" className="rounded-[14px]">
                        <Wordmark />
                    </Link>

                    {showNav && (
                        <nav className="hidden items-center gap-1 md:flex">
                            {items.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === '/'}
                                    className={({ isActive }) =>
                                        cn(
                                            'rounded-[14px] px-3.5 py-1.5 text-[15px] font-bold transition-colors',
                                            isActive
                                                ? 'bg-foreground text-night'
                                                : 'text-muted-foreground hover:text-foreground',
                                        )
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>
                    )}

                    {headerExtra}

                    <div className="ml-auto flex shrink-0 items-center gap-2">
                        {variant === 'public' && (
                            <Button variant="ghost" size="sm" asChild>
                                <Link to="/">Open Dōzobin</Link>
                            </Button>
                        )}
                        {showNav && <AccountMenu />}
                    </div>
                </div>
            </header>

            <main className="flex-1">
                <div className="h-[300px] sm:h-[340px]">
                    {head && (
                        <div className="rail pt-[88px] sm:pt-[100px]">
                            {head}
                        </div>
                    )}
                </div>
                <div className="relative z-10 -mt-16">{children}</div>
            </main>

            <NightCity />
            <SiteFooter phoneNav={showNav} />

            {showNav && (
                <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 grid grid-flow-col gap-1 bg-background/95 px-2 pt-1.5 backdrop-blur-md md:hidden">
                    {items.map((item) => {
                        const active =
                            item.to === '/'
                                ? pathname === '/'
                                : pathname.startsWith(item.to);

                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'mb-1.5 flex flex-col items-center gap-0.5 rounded-[14px] py-1.5 text-[12px] font-bold transition-colors',
                                    active
                                        ? 'bg-sunken text-foreground'
                                        : 'text-muted-foreground',
                                )}
                            >
                                <item.icon
                                    weight={active ? 'fill' : 'regular'}
                                    className="size-5"
                                />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            )}
        </div>
    );
}
