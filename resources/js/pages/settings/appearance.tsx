import { AppProviders } from '@/components/app-providers';
import { AppearanceSettings, SettingsLayout } from '@/screens/settings';

export default function AppearancePage() {
    return (
        <AppProviders>
            <SettingsLayout>
                <AppearanceSettings />
            </SettingsLayout>
        </AppProviders>
    );
}
