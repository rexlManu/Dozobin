import { AppProviders } from '@/components/app-providers';
import {
    AdminLayout,
    AdminSettingsLayout,
    ExpirationSettings,
} from '@/screens/admin';

export default function ExpirationSettingsPage() {
    return (
        <AppProviders>
            <AdminLayout>
                <AdminSettingsLayout>
                    <ExpirationSettings />
                </AdminSettingsLayout>
            </AdminLayout>
        </AppProviders>
    );
}
