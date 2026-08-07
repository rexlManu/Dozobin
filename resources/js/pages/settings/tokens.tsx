import { AppProviders } from '@/components/app-providers';
import { SettingsLayout, TokensSettings } from '@/screens/settings';

export default function TokensPage() {
    return (
        <AppProviders>
            <SettingsLayout>
                <TokensSettings />
            </SettingsLayout>
        </AppProviders>
    );
}
