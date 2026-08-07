import { AppProviders } from '@/components/app-providers';
import {
    AccessSettings,
    AdminLayout,
    AdminSettingsLayout,
} from '@/screens/admin';

export default function AccessSettingsPage() {
    return (
        <AppProviders>
            <AdminLayout>
                <AdminSettingsLayout>
                    <AccessSettings />
                </AdminSettingsLayout>
            </AdminLayout>
        </AppProviders>
    );
}
