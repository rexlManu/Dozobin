/** @vitest-environment jsdom */

import { Children, Fragment, isValidElement } from 'react';
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { AppProviders } from '@/components/app-providers';

const inertia = vi.hoisted(() => ({
    head: vi.fn(),
    page: {
        component: 'workspace',
        props: {
            name: 'Dōzobin',
            appearance: 'system',
            seo: {
                description: 'Share files',
                robots: 'index, follow',
                canonical: 'https://example.test',
                image: null,
            },
        },
    },
}));

vi.mock('@inertiajs/react', () => ({
    Head: ({ children }: { children: ReactNode }) => {
        inertia.head(children);

        return null;
    },
    usePage: () => inertia.page,
}));

vi.mock('@/components/theme-provider', () => ({
    ThemeProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('@/components/ui/sonner', () => ({
    Toaster: () => null,
}));

vi.mock('@/components/ui/tooltip', () => ({
    TooltipProvider: ({ children }: { children: ReactNode }) => children,
}));

it('passes canonical SEO tags to Inertia Head as flat elements', () => {
    renderToString(<AppProviders>Workspace</AppProviders>);

    const headChildren = Children.toArray(inertia.head.mock.lastCall?.[0]);

    expect(headChildren).not.toHaveLength(0);
    expect(
        headChildren.every(
            (child) => isValidElement(child) && child.type !== Fragment,
        ),
    ).toBe(true);
});
