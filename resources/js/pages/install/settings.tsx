import { AppProviders } from '@/components/app-providers';
import type { AdminConfig } from '@/lib/types';
import { SettingsStep } from '@/screens/install';

export default function InstallSettingsPage({
    defaults,
}: {
    defaults: AdminConfig;
}) {
    return (
        <AppProviders>
            <SettingsStep defaults={defaults} />
        </AppProviders>
    );
}
