import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { OutletProvider } from '@/lib/navigation';
import {
    AccessSettings,
    AdminLayout,
    AdminSettingsLayout,
    ExpirationSettings,
    FileTypesSettings,
    HousekeepingSettings,
    LimitsSettings,
    TransferSettings,
} from '@/screens/admin';
import { AdminTransfersRoute } from '@/screens/admin-transfers';
import {
    AdminUploadsRoute,
    AdminUserUploadsRoute,
} from '@/screens/admin-uploads';
import { AdminUserRoute, AdminUsersRoute } from '@/screens/admin-users';
import { RegisterRoute, ResetRoute, SignInRoute } from '@/screens/auth';
import { LibraryRoute } from '@/screens/library';
import { PasteViewRoute } from '@/screens/paste-view';
import {
    AppearanceSettings,
    ProfileSettings,
    SecuritySettings,
    SettingsLayout,
    SharexSettings,
    SharingSettings,
    StorageSettings,
    TokensSettings,
} from '@/screens/settings';
import { ShareViewRoute } from '@/screens/share-view';
import { StatesRoute } from '@/screens/states';
import { TransferLobbyRoute } from '@/screens/transfer-lobby';
import { TransferSessionRoute } from '@/screens/transfer-session';
import { WorkspaceRoute } from '@/screens/workspace';

const memberSettings = {
    'settings-profile': ProfileSettings,
    'settings-appearance': AppearanceSettings,
    'settings-sharing': SharingSettings,
    'settings-storage': StorageSettings,
    'settings-security': SecuritySettings,
    'settings-tokens': TokensSettings,
    'settings-sharex': SharexSettings,
} as const;

const adminSettings = {
    'admin-settings-access': AccessSettings,
    'admin-settings-expiration': ExpirationSettings,
    'admin-settings-limits': LimitsSettings,
    'admin-settings-file-types': FileTypesSettings,
    'admin-settings-transfer': TransferSettings,
    'admin-settings-housekeeping': HousekeepingSettings,
} as const;

export interface AppProps {
    screen: string;
}

function Screen({ screen }: AppProps) {
    if (screen in memberSettings) {
        const Page = memberSettings[screen as keyof typeof memberSettings];

        return (
            <OutletProvider elements={[<Page key={screen} />]}>
                <SettingsLayout />
            </OutletProvider>
        );
    }

    if (screen in adminSettings) {
        const Page = adminSettings[screen as keyof typeof adminSettings];

        return (
            <OutletProvider
                elements={[
                    <AdminSettingsLayout key="settings" />,
                    <Page key={screen} />,
                ]}
            >
                <AdminLayout />
            </OutletProvider>
        );
    }

    switch (screen) {
        case 'library':
            return <LibraryRoute />;
        case 'share':
            return <ShareViewRoute />;
        case 'paste':
            return <PasteViewRoute />;
        case 'transfer-lobby':
            return <TransferLobbyRoute />;
        case 'transfer-session':
            return <TransferSessionRoute />;
        case 'signin':
            return <SignInRoute />;
        case 'register':
            return <RegisterRoute />;
        case 'reset':
            return <ResetRoute />;
        case 'states':
            return <StatesRoute />;
        case 'admin-users':
            return (
                <OutletProvider elements={[<AdminUsersRoute />]}>
                    <AdminLayout />
                </OutletProvider>
            );
        case 'admin-user':
            return (
                <OutletProvider elements={[<AdminUserRoute />]}>
                    <AdminLayout />
                </OutletProvider>
            );
        case 'admin-uploads':
            return (
                <OutletProvider elements={[<AdminUploadsRoute />]}>
                    <AdminLayout />
                </OutletProvider>
            );
        case 'admin-user-uploads':
            return (
                <OutletProvider elements={[<AdminUserUploadsRoute />]}>
                    <AdminLayout />
                </OutletProvider>
            );
        case 'admin-transfers':
            return (
                <OutletProvider elements={[<AdminTransfersRoute />]}>
                    <AdminLayout />
                </OutletProvider>
            );
        default:
            return <WorkspaceRoute />;
    }
}

export default function App({ screen }: AppProps) {
    return (
        <ThemeProvider>
            <TooltipProvider delayDuration={200}>
                <Screen screen={screen} />
                <Toaster position="bottom-center" />
            </TooltipProvider>
        </ThemeProvider>
    );
}
