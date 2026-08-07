import { AppProviders } from '@/components/app-providers';
import type { Account, Share } from '@/lib/types';
import { AdminLayout } from '@/screens/admin';
import { AdminUserUploadsRoute } from '@/screens/admin-uploads';

export default function AdminUserUploadsPage({
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
                <AdminUserUploadsRoute
                    account={account}
                    accounts={accounts}
                    shares={shares}
                />
            </AdminLayout>
        </AppProviders>
    );
}
