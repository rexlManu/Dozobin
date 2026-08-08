import { Head, usePage } from '@inertiajs/react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

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
    'admin/invites/index': 'Invite codes',
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
    const { component } = usePage();

    return (
        <ThemeProvider>
            <Head title={titleForComponent(component)} />
            <TooltipProvider delayDuration={200}>
                {children}
                <Toaster position="bottom-center" />
            </TooltipProvider>
        </ThemeProvider>
    );
}
