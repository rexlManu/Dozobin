import { AppProviders } from '@/components/app-providers';
import { SettingsLayout, SharingSettings } from '@/screens/settings';

export default function SharingPage() {
    return (
        <AppProviders>
            <SettingsLayout>
                <SharingSettings />
            </SettingsLayout>
        </AppProviders>
    );
}
