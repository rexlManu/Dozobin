import { AppProviders } from '@/components/app-providers';
import type { Account, Share } from '@/lib/types';
import { AdminLayout } from '@/screens/admin';
import { AdminUploadsRoute } from '@/screens/admin-uploads';

export default function AdminUploadsPage({
    accounts,
    shares,
}: {
    accounts: Account[];
    shares: Share[];
}) {
    return (
        <AppProviders>
            <AdminLayout>
                <AdminUploadsRoute accounts={accounts} shares={shares} />
            </AdminLayout>
        </AppProviders>
    );
}
