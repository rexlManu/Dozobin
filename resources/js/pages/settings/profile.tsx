import { AppProviders } from '@/components/app-providers';
import { ProfileSettings, SettingsLayout } from '@/screens/settings';

export default function ProfilePage() {
    return (
        <AppProviders>
            <SettingsLayout>
                <ProfileSettings />
            </SettingsLayout>
        </AppProviders>
    );
}
