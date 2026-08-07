import { AppProviders } from '@/components/app-providers';
import {
    AdminLayout,
    AdminSettingsLayout,
    FileTypesSettings,
} from '@/screens/admin';

export default function FileTypesSettingsPage() {
    return (
        <AppProviders>
            <AdminLayout>
                <AdminSettingsLayout>
                    <FileTypesSettings />
                </AdminSettingsLayout>
            </AdminLayout>
        </AppProviders>
    );
}
