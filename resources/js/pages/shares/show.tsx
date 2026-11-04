import { router } from '@inertiajs/react';
import {
    DownloadSimple,
    LockKeyOpen,
    ShieldCheck,
} from '@phosphor-icons/react';
import { AppProviders } from '@/components/app-providers';
import { AppShell } from '@/components/app-shell';
import { CopyButton } from '@/components/copy-button';
import { Dozo } from '@/components/dozo';
import { ExpiryLabel } from '@/components/expiry';
import { FileGlyph } from '@/components/file-glyph';
import { FilePreview } from '@/components/file-preview';
import { PasswordGate } from '@/components/password-gate';
import { ShareMetaRow } from '@/components/share-meta-row';
import { Button } from '@/components/ui/button';
import { Unavailable } from '@/components/unavailable';
import { useNow } from '@/hooks/use-now';
import { requestJson } from '@/lib/api';
import { mimeLabel } from '@/lib/detect';
import { downloadSource } from '@/lib/download';
import { formatBytes, formatDateTime, shareUrl } from '@/lib/format';
import { isShareExpired } from '@/lib/share-state';
import type { FileShare, MalwareScanStatus } from '@/lib/types';

function ShareViewRoute({
    share,
    unlocked,
}: {
    share: FileShare;
    unlocked: boolean;
}) {
    const now = useNow(30_000);

    if (share.state === 'blocked') {
        return (
            <AppShell variant="public">
                <Unavailable
                    reason="blocked"
                    detail={share.malwareScan?.detectionName ?? undefined}
                />
            </AppShell>
        );
    }

    if (isShareExpired(share, now)) {
        return (
            <AppShell variant="public">
                <Unavailable reason="expired" expiredAt={share.expiresAt} />
            </AppShell>
        );
    }

    if (share.password && !unlocked) {
        return (
            <AppShell variant="public">
                <PasswordGate
                    kind="file"
                    expiresAt={share.expiresAt}
                    onUnlock={async (password) => {
                        try {
                            await requestJson(`/shares/${share.id}/unlock`, {
                                method: 'POST',
                                body: JSON.stringify({ password }),
                            });
                            router.reload({ only: ['share', 'unlocked'] });

                            return true;
                        } catch {
                            return false;
                        }
                    }}
                />
            </AppShell>
        );
    }

    if (share.state === 'unavailable') {
        return (
            <AppShell variant="public">
                <Unavailable reason="gone" detail={share.filename} />
            </AppShell>
        );
    }

    return (
        <AppShell variant="public">
            <FileShareBody share={share} />
        </AppShell>
    );
}

export default function SharePage({
    share,
    unlocked,
}: {
    share: FileShare;
    unlocked: boolean;
}) {
    return (
        <AppProviders>
            <ShareViewRoute share={share} unlocked={unlocked} />
        </AppProviders>
    );
}

const SAFETY: Partial<
    Record<MalwareScanStatus, { label: string; tone: string }>
> = {
    clean: { label: 'No threat found', tone: 'text-mint' },
    pending: { label: 'Being checked now', tone: 'text-lavender' },
    failed: { label: 'Could not be scanned', tone: 'text-lamp' },
    skipped: { label: 'Not scanned', tone: 'text-muted-foreground' },
};

function FileShareBody({ share }: { share: FileShare }) {
    const url = shareUrl(share);
    const source = share.objectUrl ?? share.demoSrc;
    const safety = share.malwareScan?.status
        ? SAFETY[share.malwareScan.status]
        : undefined;

    return (
        <div className="rail grid gap-6 pt-4 pb-20 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <FilePreview share={share} />

            <section className="grid gap-4 rounded-[28px] border-[1.5px] border-border bg-card p-6 lg:sticky lg:top-20">
                <p className="flex items-center gap-2.5 text-muted-foreground">
                    <Dozo size={56} mood="happy" />
                    Someone sent you a file.
                </p>
                <h1 className="flex items-start gap-2 text-[24px] leading-tight font-bold [overflow-wrap:anywhere]">
                    {share.filename}
                </h1>
                <dl className="border-y-[1.5px] border-dashed border-border py-3">
                    <ShareMetaRow label="Size">
                        {formatBytes(share.size)}
                    </ShareMetaRow>
                    <ShareMetaRow label="Type">
                        <span className="inline-flex items-center gap-1.5">
                            <FileGlyph
                                mime={share.mime}
                                filename={share.filename}
                                className="size-4"
                            />
                            {mimeLabel(share.mime, share.filename)}
                        </span>
                    </ShareMetaRow>
                    <ShareMetaRow label="Sent">
                        {formatDateTime(share.createdAt)}
                    </ShareMetaRow>
                    <ShareMetaRow label="Link stays">
                        <ExpiryLabel expiresAt={share.expiresAt} prefix="" />
                    </ShareMetaRow>
                    {safety && (
                        <ShareMetaRow label="Safety">
                            <span
                                className={`inline-flex items-center gap-1.5 font-bold ${safety.tone}`}
                            >
                                <ShieldCheck className="size-4" />{' '}
                                {safety.label}
                            </span>
                        </ShareMetaRow>
                    )}
                    {share.password && (
                        <ShareMetaRow label="Password">
                            <span className="inline-flex items-center gap-1.5">
                                <LockKeyOpen className="size-4" /> Unlocked here
                            </span>
                        </ShareMetaRow>
                    )}
                </dl>
                <Button
                    size="lg"
                    className="w-full"
                    onClick={() => downloadSource(source, share.filename)}
                >
                    <DownloadSimple weight="bold" /> Download ·{' '}
                    {formatBytes(share.size)}
                </Button>
                <CopyButton value={url} variant="ghost" className="w-full" />
            </section>
        </div>
    );
}
