import { AdminLayout } from '@/components/admin-layout';
import { AdminUploadsExplorer } from '@/components/admin-uploads-explorer';
import { AppProviders } from '@/components/app-providers';
import type { Account, Share } from '@/lib/types';

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
                <AdminUploadsExplorer shares={shares} accountList={accounts} />
            </AdminLayout>
        </AppProviders>
    );
}
