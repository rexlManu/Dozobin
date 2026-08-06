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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, NavLink, useLocation, useNavigate } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { useDozo } from '@/store/store';

interface NavItem {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

function navItems(role: 'guest' | 'member' | 'admin'): NavItem[] {
    const items: NavItem[] = [{ to: '/', label: 'Drop', icon: UploadSimple }];

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
    const account = useDozo((s) => s.account());
    const signOut = useDozo((s) => s.signOut);
    const navigate = useNavigate();

    if (!account) {
        return (
            // One bordered control, one plain link. Two buttons side by side was half
            // the reason the header read as a row of loose chips.
            <div className="flex items-center gap-3.5">
                <Link
                    to="/register"
                    className="text-muted-foreground hover:text-foreground hidden text-[13px] font-medium transition-colors sm:block"
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
                    className="hover:bg-muted flex items-center gap-2 rounded-md p-0.5 pr-2 transition-colors"
                >
                    <Avatar className="size-7 rounded-md">
                        <AvatarImage
                            src={account.avatarSrc}
                            alt=""
                            className="rounded-md"
                        />
                        <AvatarFallback className="rounded-md text-[11px]">
                            {account.name.slice(0, 2)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-[13px] font-medium sm:inline">
                        {account.name.split(' ')[0]}
                    </span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span>{account.name}</span>
                    <span className="text-muted-foreground font-mono text-[11px] font-normal">
                        {account.email}
                    </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate('/library')}>
                    <Stack /> Library
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/settings')}>
                    <Gear /> Settings
                </DropdownMenuItem>
                {account.role === 'admin' && (
                    <DropdownMenuItem onSelect={() => navigate('/admin')}>
                        <Wrench /> Installation admin
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onSelect={() => {
                        signOut();
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
    const impersonating = useDozo((s) => s.impersonating);
    const accounts = useDozo((s) => s.accounts);
    const viewing = useDozo((s) => s.account());
    const stop = useDozo((s) => s.stopViewingAs);

    if (!impersonating || !viewing) {
        return null;
    }

    const real = accounts[impersonating];

    return (
        <div className="border-border bg-sunken shrink-0 border-b">
            <div className="rail flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2">
                <Eye
                    weight="fill"
                    className="text-muted-foreground size-4 shrink-0"
                />
                <p className="text-[13px]">
                    Viewing as{' '}
                    <span className="font-medium">{viewing.name}</span>
                </p>
                <p className="text-muted-foreground font-mono text-[11px]">
                    actions are applied as this account
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={() => {
                        stop();
                    }}
                >
                    Return to {real?.name.split(' ')[0] ?? 'yourself'}
                </Button>
            </div>
        </div>
    );
}

export function AppShell({
    children,
    variant = 'app',
    surface = 'page',
    headerExtra,
}: {
    children: React.ReactNode;
    variant?: 'app' | 'public';
    /**
     * "canvas" hands the whole window to the route: the page never scrolls, and
     * the chrome sits in flow so the route can bleed to every edge between it.
     */
    surface?: 'page' | 'canvas';
    /** Route-level controls that belong in the header rather than on the canvas. */
    headerExtra?: React.ReactNode;
}) {
    const role = useDozo((s) => s.role());
    const { pathname } = useLocation();
    const items = navItems(role);
    const showNav = variant === 'app';
    const canvas = surface === 'canvas';

    return (
        <div
            className={cn(
                'bg-background flex flex-col',
                canvas ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]',
            )}
        >
            <header className="border-border bg-background/85 sticky top-0 z-30 border-b backdrop-blur-md">
                <div className="rail flex h-14 items-center gap-4">
                    <Link to="/" className="rounded-md focus-visible:outline-2">
                        <Wordmark />
                    </Link>

                    {showNav && (
                        <>
                            <span
                                aria-hidden
                                className="bg-border hidden h-5 w-px md:block"
                            />

                            {/*
                Labels marked by a hairline sitting on the header's own bottom
                rule, not filled chips. The indicator is ink rather than yuzu:
                the accent belongs to the act on the page, never to navigation.
              */}
                            <nav className="hidden h-full items-center gap-6 md:flex">
                                {items.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        end={item.to === '/'}
                                        className={({ isActive }) =>
                                            cn(
                                                'relative flex h-full items-center text-[13px] font-medium transition-colors',
                                                'after:absolute after:inset-x-0 after:-bottom-px after:h-[1.5px] after:transition-colors',
                                                isActive
                                                    ? 'text-foreground after:bg-foreground'
                                                    : 'text-muted-foreground hover:text-foreground after:bg-transparent',
                                            )
                                        }
                                    >
                                        {item.label}
                                    </NavLink>
                                ))}
                            </nav>
                        </>
                    )}

                    {headerExtra && (
                        <>
                            <span
                                aria-hidden
                                className="bg-border hidden h-5 w-px md:block"
                            />
                            {headerExtra}
                        </>
                    )}

                    <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
                        {variant === 'public' && (
                            <Button variant="ghost" size="sm" asChild>
                                <Link to="/">Open Dōzobin</Link>
                            </Button>
                        )}
                        {showNav && (
                            <>
                                <span
                                    aria-hidden
                                    className="bg-border h-5 w-px"
                                />
                                <AccountMenu />
                            </>
                        )}
                    </div>
                </div>
            </header>

            <ImpersonationBanner />

            <main
                className={cn('flex-1', canvas ? 'min-h-0' : 'pb-24 md:pb-0')}
            >
                {children}
            </main>

            {showNav && (
                <nav
                    className={cn(
                        'pb-safe border-border bg-background/95 z-30 grid grid-flow-col border-t backdrop-blur-md md:hidden',
                        // On a canvas the nav is a real row of the window, so nothing has to
                        // reserve padding for it and the canvas can measure its own height.
                        canvas ? 'shrink-0' : 'fixed inset-x-0 bottom-0',
                    )}
                >
                    {items.map((item) => {
                        const active =
                            item.to === '/'
                                ? pathname === '/'
                                : pathname.startsWith(item.to);

                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={cn(
                                    'relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                                    active
                                        ? 'text-foreground'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {/* The desktop indicator, mirrored onto this nav's own rule. */}
                                {active && (
                                    <span
                                        aria-hidden
                                        className="bg-foreground absolute inset-x-4 -top-px h-[1.5px]"
                                    />
                                )}
                                <item.icon className="size-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            )}
        </div>
    );
}
