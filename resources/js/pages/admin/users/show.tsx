import { AppProviders } from '@/components/app-providers';
import type { Account, Share } from '@/lib/types';
import { AdminLayout } from '@/screens/admin';
import { AdminUserRoute } from '@/screens/admin-users';

export default function AdminUserPage({
    account,
    accounts,
    shares,
}: {
    account: Account;
    accounts: Account[];
    shares: Share[];
}) {
    return (
        <AppProviders>
            <AdminLayout>
                <AdminUserRoute
                    account={account}
                    accounts={accounts}
                    shares={shares}
                />
            </AdminLayout>
        </AppProviders>
    );
}
