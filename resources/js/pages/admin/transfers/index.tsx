import { AppProviders } from '@/components/app-providers';
import type { TransferSession } from '@/lib/types';
import { AdminLayout } from '@/screens/admin';
import { AdminTransfersRoute } from '@/screens/admin-transfers';

export default function AdminTransfersPage({
    transfer,
    transferHistory,
}: {
    transfer: TransferSession | null;
    transferHistory: TransferSession[];
}) {
    return (
        <AppProviders>
            <AdminLayout>
                <AdminTransfersRoute
                    transfer={transfer}
                    transferHistory={transferHistory}
                />
            </AdminLayout>
        </AppProviders>
    );
}
