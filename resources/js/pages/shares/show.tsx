import { router } from '@inertiajs/react';
import { DownloadSimple, LockKey } from '@phosphor-icons/react';
import { AppProviders } from '@/components/app-providers';
import { AppShell } from '@/components/app-shell';
import { CopyButton } from '@/components/copy-button';
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
import type { FileShare } from '@/lib/types';

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

function FileShareBody({ share }: { share: FileShare }) {
    const url = shareUrl(share);
    const source = share.objectUrl ?? share.demoSrc;

    return (
        <div className="rail py-6 sm:py-8">
            <div className="flex flex-wrap items-start gap-3">
                <div className="mt-1 text-muted-foreground">
                    <FileGlyph
                        mime={share.mime}
                        filename={share.filename}
                        className="size-5"
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg font-medium tracking-[-0.015em] break-all sm:text-xl">
                        {share.filename}
                    </h1>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11.5px] text-muted-foreground">
                        <span>{mimeLabel(share.mime, share.filename)}</span>
                        <span>{formatBytes(share.size)}</span>
                        {share.password && (
                            <span className="inline-flex items-center gap-1 text-foreground">
                                <LockKey className="size-3.5" /> unlocked here
                            </span>
                        )}
                    </p>
                </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
                <FilePreview share={share} />

                <aside className="lg:sticky lg:top-20 lg:self-start">
                    <div className="flex flex-col gap-2">
                        <Button
                            size="lg"
                            onClick={() =>
                                downloadSource(source, share.filename)
                            }
                        >
                            <DownloadSimple /> Download
                        </Button>
                        <CopyButton value={url} size="lg" className="w-full" />
                    </div>

                    <dl className="mt-5 divide-y divide-border border-t border-border">
                        <ShareMetaRow label="Type">
                            {mimeLabel(share.mime, share.filename)}
                        </ShareMetaRow>
                        <ShareMetaRow label="Size">
                            <span className="font-mono">
                                {formatBytes(share.size)}
                            </span>
                        </ShareMetaRow>
                        <ShareMetaRow label="Created">
                            {formatDateTime(share.createdAt)}
                        </ShareMetaRow>
                        <ShareMetaRow label="Expires">
                            <ExpiryLabel
                                expiresAt={share.expiresAt}
                                prefix=""
                                className="text-[12.5px]"
                            />
                        </ShareMetaRow>
                        <ShareMetaRow label="Opened">
                            <span className="font-mono">{share.views}×</span>
                        </ShareMetaRow>
                    </dl>

                    <p className="mt-4 text-[11.5px] leading-relaxed text-muted-foreground">
                        Unlisted. Anyone holding this URL can open it, and
                        Dōzobin does not list or index it anywhere.
                    </p>
                </aside>
            </div>
        </div>
    );
}
