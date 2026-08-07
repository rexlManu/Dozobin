import { AppProviders } from '@/components/app-providers';
import type { TransferSession } from '@/lib/types';
import {
    AdminLayout,
    AdminSettingsLayout,
    TransferSettings,
} from '@/screens/admin';

export default function TransferSettingsPage({
    transfer,
}: {
    transfer: TransferSession | null;
}) {
    return (
        <AppProviders>
            <AdminLayout>
                <AdminSettingsLayout>
                    <TransferSettings transfer={transfer} />
                </AdminSettingsLayout>
            </AdminLayout>
        </AppProviders>
    );
}
