import { AdminLayout } from '@/components/admin-layout';
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
                description="A Transfer Session is a scratch space between devices. It has no owner and no Library, so the only thing that ends it is time."
            />
            <AdminSettingsField
                label="Inactivity window"
                hint="A session ends this long after the last thing anyone does in it. Every item in it goes at the same moment."
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
                                transferWindowHours: Number(event.target.value),
                            })
                        }
                        className="w-[9rem] font-mono"
                    />
                    <span className="font-mono text-[12px] text-muted-foreground">
                        hours
                    </span>
                </div>
            </AdminSettingsField>

            <p className="border-t border-border pt-4 font-mono text-[11.5px] text-muted-foreground">
                {live ? (
                    <>
                        One live session · {transfer.code} · clears in{' '}
                        <Countdown
                            target={transferExpiresAt(transfer, windowMs)}
                        />
                    </>
                ) : (
                    'No live session on this installation right now.'
                )}
            </p>
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
