import { Link as InertiaLink, router, usePage } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { forwardRef } from 'react';
import type { ReactNode } from 'react';

interface NavState {
    isActive: boolean;
}
type LinkClassName = string | ((state: NavState) => string);

interface LinkProps extends Omit<
    InertiaLinkProps,
    'href' | 'className' | 'children'
> {
    to: string;
    replace?: boolean;
    end?: boolean;
    className?: LinkClassName;
    children?: ReactNode | ((state: NavState) => ReactNode);
}

function pathFrom(url: string): string {
    return url.split('?')[0] || '/';
}

export const Link = forwardRef<unknown, LinkProps>(function Link(
    { to, replace = false, className, children, end, ...props },
    ref,
) {
    void end;
    const active = pathFrom(usePage().url) === pathFrom(to);

    return (
        <InertiaLink
            ref={ref}
            href={to}
            replace={replace}
            prefetch="hover"
            cacheFor="30s"
            className={
                typeof className === 'function'
                    ? className({ isActive: active })
                    : className
            }
            {...props}
        >
            {typeof children === 'function'
                ? children({ isActive: active })
                : children}
        </InertiaLink>
    );
});

export const NavLink = forwardRef<unknown, LinkProps>(function NavLink(
    { to, end = false, className, children, ...props },
    ref,
) {
    const pathname = pathFrom(usePage().url);
    const target = pathFrom(to);
    const active = end
        ? pathname === target
        : pathname === target || pathname.startsWith(`${target}/`);

    return (
        <InertiaLink
            ref={ref}
            href={to}
            prefetch="hover"
            cacheFor="30s"
            className={
                typeof className === 'function'
                    ? className({ isActive: active })
                    : className
            }
            {...props}
        >
            {typeof children === 'function'
                ? children({ isActive: active })
                : children}
        </InertiaLink>
    );
});

export function useNavigate(): (
    to: string,
    options?: { replace?: boolean },
) => void {
    return (to, options) => router.visit(to, { replace: options?.replace });
}

export function useLocation(): { pathname: string } {
    return { pathname: pathFrom(usePage().url) };
}
