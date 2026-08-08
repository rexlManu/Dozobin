import { ArrowLeft } from '@phosphor-icons/react';
import { AdminLayout } from '@/components/admin-layout';
import { AdminUploadsExplorer } from '@/components/admin-uploads-explorer';
import { AppProviders } from '@/components/app-providers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
                <div className="flex flex-col gap-5">
                    <div>
                        <Link
                            to={`/admin/users/${account.id}`}
                            className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="size-3.5" /> {account.name}
                        </Link>
                        <div className="mt-3 flex items-center gap-2.5">
                            <Avatar className="size-7 rounded-md">
                                <AvatarImage
                                    src={account.avatarSrc}
                                    alt=""
                                    className="rounded-md"
                                />
                                <AvatarFallback className="rounded-md text-[11px]">
                                    {account.name.slice(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
                                Uploads by {account.name}
                            </h2>
                        </div>
                    </div>
                    <AdminUploadsExplorer
                        ownerId={account.id}
                        shares={shares}
                        accountList={accounts}
                    />
                </div>
            </AdminLayout>
        </AppProviders>
    );
}
