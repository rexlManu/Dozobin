import { router } from '@inertiajs/react';
import { DownloadSimple, LockKey } from '@phosphor-icons/react';
import { useState } from 'react';
import { AppProviders } from '@/components/app-providers';
import { AppShell } from '@/components/app-shell';
import { CodeBlock } from '@/components/code-block';
import { CopyButton } from '@/components/copy-button';
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
    if (isShareExpired(share)) {
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
        <div className="rail py-6 sm:py-8">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-t-xl border border-b-0 border-border bg-card px-3 py-2.5">
                        <span className="font-mono text-[11px] tracking-[0.06em] text-muted-foreground uppercase">
                            {typeLabel}
                        </span>

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

                    <div className="overflow-hidden rounded-b-xl border border-border bg-card">
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

                <aside className="lg:sticky lg:top-20 lg:self-start">
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

                    <dl className="mt-5 divide-y divide-border border-t border-border">
                        <ShareMetaRow label="Content">{typeLabel}</ShareMetaRow>
                        <ShareMetaRow label="Length">
                            <span className="font-mono">
                                {lines} lines · {formatBytes(bytes)}
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
                        {share.password && (
                            <ShareMetaRow label="Access">
                                <span className="inline-flex items-center gap-1.5">
                                    <LockKey className="size-3.5" /> Password
                                </span>
                            </ShareMetaRow>
                        )}
                    </dl>

                    <p className="mt-4 text-[11.5px] leading-relaxed text-muted-foreground">
                        A Paste has no title on purpose. The download filename
                        comes from its URL.
                    </p>
                </aside>
            </div>
        </div>
    );
}
