import { AppProviders } from '@/components/app-providers';
import {
    AdminLayout,
    AdminSettingsLayout,
    LimitsSettings,
} from '@/screens/admin';

export default function LimitsSettingsPage() {
    return (
        <AppProviders>
            <AdminLayout>
                <AdminSettingsLayout>
                    <LimitsSettings />
                </AdminSettingsLayout>
            </AdminLayout>
        </AppProviders>
    );
}
