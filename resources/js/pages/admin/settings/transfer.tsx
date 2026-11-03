import { AdminCard, AdminLayout, Tag } from '@/components/admin-layout';
import {
    AdminSettingsField,
    AdminSettingsLayout,
    AdminSettingsPageHead,
    useAdminSettings,
} from '@/components/admin-settings-layout';
import { AppProviders } from '@/components/app-providers';
import { Countdown } from '@/components/expiry';
import { Input } from '@/components/ui/input';
import { useNow } from '@/hooks/use-now';
import { isTransferExpired, transferExpiresAt } from '@/lib/transfer-state';
import type { TransferSession } from '@/lib/types';

function TransferContent({ transfer }: { transfer: TransferSession | null }) {
    const now = useNow(30_000);
    const { draft, setDraft, shown } = useAdminSettings();
    const windowMs = draft.transferWindowHours * 60 * 60 * 1000;
    const live = transfer && !isTransferExpired(transfer, windowMs, now);

    return (
        <>
            <AdminSettingsPageHead
                title="Transfer sessions"
                description="A Transfer Session has no owner and no Library, so only time ends it."
            />
            <AdminCard className="grid gap-6">
                <AdminSettingsField
                    label="Inactivity window"
                    hint="A session and all its items go this long after the last activity in it."
                    error={shown('transferWindowHours')}
                >
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min={1}
                            max={168}
                            value={draft.transferWindowHours}
                            aria-invalid={Boolean(shown('transferWindowHours'))}
                            onChange={(event) =>
                                setDraft({
                                    transferWindowHours: Number(
                                        event.target.value,
                                    ),
                                })
                            }
                            className="w-[9rem]"
                        />
                        <span className="text-[14px] text-muted-foreground">
                            hours
                        </span>
                    </div>
                </AdminSettingsField>

                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[18px] bg-sunken px-4 py-3 text-[14px]">
                    {live ? (
                        <>
                            <Tag tone="mint">Running</Tag>
                            <span className="font-mono">{transfer.code}</span>
                            <span className="text-muted-foreground">
                                clears in
                            </span>
                            <Countdown
                                target={transferExpiresAt(transfer, windowMs)}
                                className="text-lamp"
                            />
                        </>
                    ) : (
                        <span className="text-muted-foreground">
                            No session is running right now.
                        </span>
                    )}
                </p>
            </AdminCard>
        </>
    );
}

export default function TransferPage({
    transfer,
}: {
    transfer: TransferSession | null;
}) {
    return (
        <AppProviders>
            <AdminLayout>
                <AdminSettingsLayout>
                    <TransferContent transfer={transfer} />
                </AdminSettingsLayout>
            </AdminLayout>
        </AppProviders>
    );
}
