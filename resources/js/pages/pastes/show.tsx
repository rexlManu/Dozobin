import { router } from '@inertiajs/react';
import { DownloadSimple, LockKey } from '@phosphor-icons/react';
import { useState } from 'react';
import { AppProviders } from '@/components/app-providers';
import { AppShell } from '@/components/app-shell';
import { CodeBlock } from '@/components/code-block';
import { CopyButton } from '@/components/copy-button';
import { Dozo } from '@/components/dozo';
import { ExpiryLabel } from '@/components/expiry';
import { MarkdownView } from '@/components/markdown-view';
import { PasswordGate } from '@/components/password-gate';
import { ShareMetaRow } from '@/components/share-meta-row';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Unavailable } from '@/components/unavailable';
import { useNow } from '@/hooks/use-now';
import { requestJson } from '@/lib/api';
import { LANGUAGES } from '@/lib/detect';
import { downloadText } from '@/lib/download';
import { formatBytes, formatDateTime, shareUrl } from '@/lib/format';
import { isShareExpired } from '@/lib/share-state';
import type { PasteShare } from '@/lib/types';

const EXTENSION: Record<string, string> = {
    typescript: 'ts',
    javascript: 'js',
    tsx: 'tsx',
    python: 'py',
    php: 'php',
    go: 'go',
    rust: 'rs',
    sql: 'sql',
    bash: 'sh',
    json: 'json',
    yaml: 'yaml',
    html: 'html',
    css: 'css',
    diff: 'diff',
};

function PasteViewRoute({
    share,
    unlocked,
}: {
    share: PasteShare;
    unlocked: boolean;
}) {
    const now = useNow(30_000);

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
                    kind="paste"
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

    return (
        <AppShell variant="public">
            <PasteBody share={share} />
        </AppShell>
    );
}

export default function PastePage({
    share,
    unlocked,
}: {
    share: PasteShare;
    unlocked: boolean;
}) {
    return (
        <AppProviders>
            <PasteViewRoute share={share} unlocked={unlocked} />
        </AppProviders>
    );
}

function PasteBody({ share }: { share: PasteShare }) {
    const [raw, setRaw] = useState(false);
    const [wrap, setWrap] = useState(false);
    const [numbers, setNumbers] = useState(true);

    const url = shareUrl(share);
    const languageLabel =
        LANGUAGES.find((l) => l.id === share.language)?.label ?? share.language;
    const extension =
        share.pasteType === 'markdown'
            ? 'md'
            : (EXTENSION[share.language ?? ''] ?? 'txt');
    const filename = `dozobin-${share.id}.${extension}`;
    const lines = share.body.replace(/\n$/, '').split('\n').length;
    const bytes = new TextEncoder().encode(share.body).length;

    const typeLabel =
        share.pasteType === 'markdown'
            ? 'Markdown'
            : share.pasteType === 'code'
              ? `Source code · ${languageLabel}`
              : 'Plain text';

    // Markdown is the only type with a rendered view. Code and plain text always
    // show the source, so the gutter and wrapping controls stay useful there.
    const showMarkdown = share.pasteType === 'markdown' && !raw;
    const highlightAs =
        raw || share.pasteType !== 'code' ? 'text' : (share.language ?? 'text');

    return (
        <div className="rail pt-4 pb-20">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                <div className="min-w-0 overflow-hidden rounded-[28px] border-[1.5px] border-border bg-card">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-sunken px-4 py-2.5">
                        <span className="font-bold">{typeLabel}</span>

                        <div className="ml-auto flex flex-wrap items-center gap-1">
                            {share.pasteType !== 'text' && (
                                <Toggle
                                    size="sm"
                                    pressed={raw}
                                    onPressedChange={setRaw}
                                    aria-label="Show the raw source"
                                >
                                    Raw
                                </Toggle>
                            )}
                            {!showMarkdown && (
                                <>
                                    <Toggle
                                        size="sm"
                                        pressed={wrap}
                                        onPressedChange={setWrap}
                                    >
                                        Wrap
                                    </Toggle>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>
                                                <Toggle
                                                    size="sm"
                                                    pressed={numbers && !wrap}
                                                    disabled={wrap}
                                                    onPressedChange={setNumbers}
                                                >
                                                    Lines
                                                </Toggle>
                                            </span>
                                        </TooltipTrigger>
                                        {wrap && (
                                            <TooltipContent>
                                                A gutter cannot stay aligned
                                                with wrapped lines
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </>
                            )}
                            <CopyButton
                                value={share.body}
                                variant="ghost"
                                size="sm"
                                label="Copy"
                                copiedLabel="Copied"
                            />
                        </div>
                    </div>

                    <div>
                        {showMarkdown ? (
                            <div className="px-4 py-5 sm:px-6 sm:py-6">
                                <MarkdownView body={share.body} />
                            </div>
                        ) : (
                            <CodeBlock
                                code={share.body}
                                language={highlightAs}
                                lineNumbers={numbers}
                                wrap={wrap}
                            />
                        )}
                    </div>
                </div>

                <aside className="grid gap-4 rounded-[28px] border-[1.5px] border-border bg-card p-6 lg:sticky lg:top-20">
                    <p className="flex items-center gap-2.5 text-muted-foreground">
                        <Dozo size={56} mood="happy" />
                        Someone sent you some text.
                    </p>
                    <div className="flex flex-col gap-2">
                        <CopyButton
                            value={url}
                            size="lg"
                            variant="default"
                            className="w-full"
                        />
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => downloadText(share.body, filename)}
                        >
                            <DownloadSimple /> Download
                        </Button>
                    </div>

                    <dl className="border-y-[1.5px] border-dashed border-border py-3">
                        <ShareMetaRow label="Content">{typeLabel}</ShareMetaRow>
                        <ShareMetaRow label="Length">
                            <span>
                                {lines} lines · {formatBytes(bytes)}
                            </span>
                        </ShareMetaRow>
                        <ShareMetaRow label="Created">
                            {formatDateTime(share.createdAt)}
                        </ShareMetaRow>
                        <ShareMetaRow label="Link stays">
                            <ExpiryLabel
                                expiresAt={share.expiresAt}
                                prefix=""
                            />
                        </ShareMetaRow>
                        <ShareMetaRow label="Opened">
                            <span>{share.views}×</span>
                        </ShareMetaRow>
                        {share.password && (
                            <ShareMetaRow label="Access">
                                <span className="inline-flex items-center gap-1.5">
                                    <LockKey className="size-4" /> Password
                                </span>
                            </ShareMetaRow>
                        )}
                    </dl>
                </aside>
            </div>
        </div>
    );
}
