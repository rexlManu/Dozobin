import { Link as InertiaLink, router, usePage } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { createContext, forwardRef, useContext, useEffect } from 'react';
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

export function useParams<T extends Record<string, string | undefined>>(): T {
    const props = usePage<{ routeParams?: Record<string, unknown> }>().props;
    const params = Object.fromEntries(
        Object.entries(props.routeParams ?? {}).map(([key, value]) => [
            key,
            value == null ? undefined : String(value),
        ]),
    );

    return params as T;
}

export function Navigate({
    to,
    replace = false,
}: {
    to: string;
    replace?: boolean;
}) {
    useEffect(() => router.visit(to, { replace }), [replace, to]);

    return null;
}

const OutletStack = createContext<{ elements: ReactNode[]; index: number }>({
    elements: [],
    index: 0,
});
const OutletValue = createContext<unknown>(undefined);

export function OutletProvider({
    children,
    elements,
}: {
    children: ReactNode;
    elements: ReactNode[];
}) {
    return (
        <OutletStack.Provider value={{ elements, index: 0 }}>
            {children}
        </OutletStack.Provider>
    );
}

export function Outlet({ context }: { context?: unknown }) {
    const stack = useContext(OutletStack);
    const element = stack.elements[stack.index] ?? null;

    return (
        <OutletStack.Provider value={{ ...stack, index: stack.index + 1 }}>
            <OutletValue.Provider value={context}>
                {element}
            </OutletValue.Provider>
        </OutletStack.Provider>
    );
}

export function useOutletContext<T>(): T {
    return useContext(OutletValue) as T;
}
