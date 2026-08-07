import { AppProviders } from '@/components/app-providers';
import { SettingsLayout, StorageSettings } from '@/screens/settings';

export default function StoragePage() {
    return (
        <AppProviders>
            <SettingsLayout>
                <StorageSettings />
            </SettingsLayout>
        </AppProviders>
    );
}
