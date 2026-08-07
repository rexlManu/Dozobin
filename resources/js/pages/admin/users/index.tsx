import { AppProviders } from '@/components/app-providers';
import type { Account, Share } from '@/lib/types';
import { AdminLayout } from '@/screens/admin';
import { AdminUsersRoute } from '@/screens/admin-users';

export default function AdminUsersPage({
    accounts,
    shares,
}: {
    accounts: Account[];
    shares: Share[];
}) {
    return (
        <AppProviders>
            <AdminLayout>
                <AdminUsersRoute accounts={accounts} shares={shares} />
            </AdminLayout>
        </AppProviders>
    );
}
