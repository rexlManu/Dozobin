import { router } from '@inertiajs/react';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { AdminCard, AdminLayout } from '@/components/admin-layout';
import {
    AdminSettingsField,
    AdminSettingsLayout,
    AdminSettingsSwitch,
    useAdminSettings,
} from '@/components/admin-settings-layout';
import { AppProviders } from '@/components/app-providers';
import { useConfirm } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNow } from '@/hooks/use-now';
import type { Share } from '@/lib/types';

function HousekeepingContent({ shares }: { shares: Share[] }) {
    const { draft, setDraft, shown } = useAdminSettings();
    const { confirm, dialog } = useConfirm();
    const now = useNow(30_000);
    const guestShares = useMemo(
        () => shares.filter((s) => s.ownerId === null),
        [shares],
    );
    const cleanupCutoff =
        now === null
            ? Number.NEGATIVE_INFINITY
            : now - draft.payloadCleanupGraceHours * 60 * 60 * 1000;
    const expiredWithPayload = useMemo(
        () =>
            shares.filter(
                (share) =>
                    share.expiresAt !== null &&
                    share.expiresAt <= cleanupCutoff &&
                    !share.payloadDeletedAt &&
                    share.hasPayload !== false,
            ),
        [cleanupCutoff, shares],
    );

    const sweep = async (ids: string[], title: string, description: string) => {
        const ok = await confirm({
            title,
            description,
            confirmLabel: 'Delete them',
        });

        if (!ok) {
            return;
        }

        router.delete('/shares', {
            data: { ids },
            preserveScroll: true,
            onSuccess: () =>
                toast(
                    `Deleted ${ids.length} ${ids.length === 1 ? 'share' : 'shares'}`,
                ),
        });
    };

    const cleanExpiredPayloads = async () => {
        const ok = await confirm({
            title: `Clean ${expiredWithPayload.length} expired payloads?`,
            description:
                'The Share records and URLs stay in place. Only their stored files or paste bodies are removed.',
            confirmLabel: 'Queue cleanup',
        });

        if (!ok) {
            return;
        }

        router.post(
            '/admin/housekeeping/expired-share-payloads',
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast('Expired payload cleanup queued'),
            },
        );
    };

    return (
        <>
            <AdminCard className="grid gap-7 sm:grid-cols-2">
                <AdminSettingsField
                    label="Expired payload grace period"
                    hint="0 means the next hourly cleanup run."
                    error={shown('payloadCleanupGraceHours')}
                >
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min={0}
                            max={8760}
                            value={draft.payloadCleanupGraceHours}
                            aria-invalid={Boolean(
                                shown('payloadCleanupGraceHours'),
                            )}
                            onChange={(event) =>
                                setDraft({
                                    payloadCleanupGraceHours: Number(
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

                <AdminSettingsSwitch
                    id="malware-scanning"
                    label="Scan new File Shares for malware"
                    hint="Needs a reachable clamd service. Files stay downloadable while a scan is pending or fails."
                    error={shown('malwareScanningEnabled')}
                    checked={draft.malwareScanningEnabled}
                    onCheckedChange={(checked) =>
                        setDraft({ malwareScanningEnabled: checked })
                    }
                />
            </AdminCard>

            <section className="grid gap-2">
                <h3 className="mb-1 text-[17px] font-bold">Clean up now</h3>
                <div className="flex flex-wrap items-center gap-3 rounded-[20px] bg-card px-4 py-3">
                    <div className="mr-auto min-w-0">
                        <p className="font-bold">Delete every Guest share</p>
                        <p className="text-[13px] text-muted-foreground">
                            {guestShares.length} on this installation now.
                        </p>
                    </div>
                    <Button
                        variant="danger"
                        size="sm"
                        disabled={guestShares.length === 0}
                        onClick={() =>
                            void sweep(
                                guestShares.map((s) => s.id),
                                `Delete ${guestShares.length} Guest shares?`,
                                'Every link a Guest handed out stops working right away. Nobody is warned first.',
                            )
                        }
                    >
                        Delete
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-[20px] bg-card px-4 py-3">
                    <div className="mr-auto min-w-0">
                        <p className="font-bold">Clean expired payloads</p>
                        <p className="text-[13px] text-muted-foreground">
                            {expiredWithPayload.length} are past expiry and the
                            grace period.
                        </p>
                    </div>
                    <Button
                        variant="danger"
                        size="sm"
                        disabled={expiredWithPayload.length === 0}
                        onClick={() => void cleanExpiredPayloads()}
                    >
                        Queue cleanup
                    </Button>
                </div>
            </section>
            {dialog}
        </>
    );
}

export default function HousekeepingPage({ shares }: { shares: Share[] }) {
    return (
        <AppProviders>
            <AdminLayout>
                <AdminSettingsLayout section="housekeeping">
                    <HousekeepingContent shares={shares} />
                </AdminSettingsLayout>
            </AdminLayout>
        </AppProviders>
    );
}
