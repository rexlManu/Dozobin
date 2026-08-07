import { AppProviders } from '@/components/app-providers';
import { SecuritySettings, SettingsLayout } from '@/screens/settings';

export default function SecurityPage() {
    return (
        <AppProviders>
            <SettingsLayout>
                <SecuritySettings />
            </SettingsLayout>
        </AppProviders>
    );
}
