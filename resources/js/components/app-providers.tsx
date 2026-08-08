import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { SharedPageProps } from '@/types';

const pageTitles: Record<string, string> = {
    workspace: 'Drop',
    'library/index': 'Library',
    'transfers/index': 'Transfer',
    'transfers/show': 'Transfer session',
    'shares/show': 'Shared file',
    'pastes/show': 'Shared paste',
    'auth/signin': 'Sign in',
    'auth/register': 'Create account',
    'auth/reset': 'Reset password',
    'install/database': 'Database setup',
    'install/account': 'Admin account setup',
    'install/settings': 'Installation settings',
    'settings/profile': 'Profile settings',
    'settings/appearance': 'Appearance settings',
    'settings/sharing': 'Sharing settings',
    'settings/storage': 'Storage settings',
    'settings/security': 'Security settings',
    'settings/tokens': 'API tokens',
    'settings/sharex': 'ShareX setup',
    'admin/users/index': 'Users',
    'admin/users/show': 'User details',
    'admin/users/uploads': 'User uploads',
    'admin/uploads/index': 'Uploads',
    'admin/transfers/index': 'Transfer sessions',
    'admin/settings/access': 'Access settings',
    'admin/settings/expiration': 'Expiration settings',
    'admin/settings/limits': 'Upload limits',
    'admin/settings/file-types': 'File types',
    'admin/settings/transfer': 'Transfer settings',
    'admin/settings/housekeeping': 'Housekeeping',
};

function titleForComponent(component: string): string {
    const fallback = component.split('/').at(-1) ?? component;

    return (
        pageTitles[component] ??
        fallback
            .replaceAll('-', ' ')
            .replace(/^./, (character) => character.toUpperCase())
    );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
    const { component, props } = usePage<SharedPageProps>();
    const title = titleForComponent(component);
    const structuredData = props.seo.canonical
        ? {
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: props.name,
              description: props.seo.description,
              url: props.seo.canonical,
              applicationCategory: 'UtilitiesApplication',
              operatingSystem: 'Web',
              isAccessibleForFree: true,
          }
        : null;
    const structuredDataJson = structuredData
        ? JSON.stringify(structuredData).replaceAll('<', '\\u003c')
        : null;

    useEffect(() => {
        // Blade supplies crawler-visible tags; Inertia owns them after hydration.
        document
            .querySelectorAll('[data-server-seo]')
            .forEach((element) => element.remove());
    }, []);

    return (
        <ThemeProvider>
            <Head title={title}>
                <meta
                    head-key="description"
                    name="description"
                    content={props.seo.description}
                />
                <meta
                    head-key="robots"
                    name="robots"
                    content={props.seo.robots}
                />
                {props.seo.canonical && (
                    <>
                        <link
                            head-key="canonical"
                            rel="canonical"
                            href={props.seo.canonical}
                        />
                        <meta
                            head-key="og:type"
                            property="og:type"
                            content="website"
                        />
                        <meta
                            head-key="og:title"
                            property="og:title"
                            content={`${title} - ${props.name}`}
                        />
                        <meta
                            head-key="og:site_name"
                            property="og:site_name"
                            content={props.name}
                        />
                        <meta
                            head-key="og:description"
                            property="og:description"
                            content={props.seo.description}
                        />
                        <meta
                            head-key="og:url"
                            property="og:url"
                            content={props.seo.canonical}
                        />
                        <meta
                            head-key="twitter:card"
                            name="twitter:card"
                            content={
                                props.seo.image
                                    ? 'summary_large_image'
                                    : 'summary'
                            }
                        />
                        {props.seo.image && (
                            <>
                                <meta
                                    head-key="og:image"
                                    property="og:image"
                                    content={props.seo.image}
                                />
                                <meta
                                    head-key="twitter:image"
                                    name="twitter:image"
                                    content={props.seo.image}
                                />
                            </>
                        )}
                        {structuredDataJson && (
                            <script
                                head-key="structured-data"
                                type="application/ld+json"
                                dangerouslySetInnerHTML={{
                                    __html: structuredDataJson,
                                }}
                            />
                        )}
                    </>
                )}
            </Head>
            <TooltipProvider delayDuration={200}>
                {children}
                <Toaster position="bottom-center" />
            </TooltipProvider>
        </ThemeProvider>
    );
}
