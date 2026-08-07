import { AppProviders } from '@/components/app-providers';
import type { Share } from '@/lib/types';
import {
    AdminLayout,
    AdminSettingsLayout,
    HousekeepingSettings,
} from '@/screens/admin';

export default function HousekeepingSettingsPage({
    shares,
}: {
    shares: Share[];
}) {
    return (
        <AppProviders>
            <AdminLayout>
                <AdminSettingsLayout>
                    <HousekeepingSettings shares={shares} />
                </AdminSettingsLayout>
            </AdminLayout>
        </AppProviders>
    );
}
