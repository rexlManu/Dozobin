import { router } from '@inertiajs/react';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin-layout';
import {
    AdminSettingsField,
    AdminSettingsLayout,
    AdminSettingsPageHead,
    useAdminSettings,
} from '@/components/admin-settings-layout';
import { AppProviders } from '@/components/app-providers';
import { useConfirm } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
    const cleanupCutoff = now - draft.payloadCleanupGraceHours * 60 * 60 * 1000;
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
            <AdminSettingsPageHead
                title="Housekeeping"
                description="Control how expired payloads leave storage and whether File Shares are checked by ClamAV. Share records remain after automatic cleanup."
            />

            <div className="grid gap-5 sm:grid-cols-2">
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
                            className="w-[9rem] font-mono"
                        />
                        <span className="font-mono text-[12px] text-muted-foreground">
                            hours
                        </span>
                    </div>
                </AdminSettingsField>

                <div className="flex items-start gap-3">
                    <Switch
                        id="malware-scanning"
                        checked={draft.malwareScanningEnabled}
                        aria-invalid={Boolean(shown('malwareScanningEnabled'))}
                        onCheckedChange={(checked) =>
                            setDraft({ malwareScanningEnabled: checked })
                        }
                    />
                    <div>
                        <Label
                            htmlFor="malware-scanning"
                            className="text-[13px]"
                        >
                            Scan new File Shares for malware
                        </Label>
                        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                            Requires a reachable clamd service. Files stay
                            downloadable while scans are pending or fail.
                        </p>
                        {shown('malwareScanningEnabled') && (
                            <p className="mt-1 text-[12px] text-destructive">
                                {shown('malwareScanningEnabled')}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                <div className="mr-auto">
                    <p className="text-[13px] font-medium">
                        Delete every Guest share
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {guestShares.length} on this installation right now.
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
                            'Every link handed out by a signed-out visitor stops resolving right away. Nobody gets a warning first.',
                        )
                    }
                >
                    Delete
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                <div className="mr-auto">
                    <p className="text-[13px] font-medium">
                        Clean expired payloads now
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {expiredWithPayload.length} are past expiry and the
                        configured grace period.
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
            {dialog}
        </>
    );
}

export default function HousekeepingPage({ shares }: { shares: Share[] }) {
    return (
        <AppProviders>
            <AdminLayout>
                <AdminSettingsLayout>
                    <HousekeepingContent shares={shares} />
                </AdminSettingsLayout>
            </AdminLayout>
        </AppProviders>
    );
}
