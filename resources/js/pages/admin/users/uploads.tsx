import { ArrowLeft } from '@phosphor-icons/react';
import { AdminLayout, AdminPageHead } from '@/components/admin-layout';
import { AdminUploadsExplorer } from '@/components/admin-uploads-explorer';
import { AppProviders } from '@/components/app-providers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials } from '@/lib/format';
import { Link } from '@/lib/navigation';
import type { Account, Share } from '@/lib/types';

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
                <div>
                    <Link
                        to={`/admin/users/${account.id}`}
                        className="inline-flex items-center gap-1.5 text-[14px] font-bold text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" /> {account.name}
                    </Link>
                    <div className="mt-4 flex items-center gap-3">
                        <Avatar className="size-10">
                            <AvatarImage src={account.avatarSrc} alt="" />
                            <AvatarFallback className="text-[13px]">
                                {initials(account.name)}
                            </AvatarFallback>
                        </Avatar>
                        <AdminPageHead title={`Uploads by ${account.name}`} />
                    </div>
                </div>
                <AdminUploadsExplorer
                    ownerId={account.id}
                    shares={shares}
                    accountList={accounts}
                />
            </AdminLayout>
        </AppProviders>
    );
}
