import { AppProviders } from '@/components/app-providers';
import { SettingsLayout, SharexSettings } from '@/screens/settings';

export default function SharexPage() {
    return (
        <AppProviders>
            <SettingsLayout>
                <SharexSettings />
            </SettingsLayout>
        </AppProviders>
    );
}
