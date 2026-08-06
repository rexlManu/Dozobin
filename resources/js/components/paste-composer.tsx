import { MagicWand } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { CodeBlock } from '@/components/code-block';
import { MarkdownView } from '@/components/markdown-view';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LANGUAGES, detectContent } from '@/lib/detect';
import type { PasteDraft } from '@/lib/detect';
import type { PasteType } from '@/lib/types';
import { cn } from '@/lib/utils';

const TYPE_LABEL: Record<PasteType, string> = {
    text: 'Plain text',
    markdown: 'Markdown',
    code: 'Source code',
};

export function PasteComposer({
    body,
    onBody,
    typeOverride,
    onTypeOverride,
    languageOverride,
    onLanguageOverride,
    resolved,
    dock,
}: {
    body: string;
    onBody: (value: string) => void;
    typeOverride: PasteType | 'auto';
    onTypeOverride: (value: PasteType | 'auto') => void;
    languageOverride: string | null;
    onLanguageOverride: (value: string | null) => void;
    resolved: PasteDraft;
    dock?: React.ReactNode;
}) {
    const [view, setView] = useState<'write' | 'preview'>('write');
    const canPreview = resolved.pasteType !== 'text' && body.trim().length > 0;

    return (
        // The window is the editor: no border, no radius, no page behind it.
        <div className="bg-card flex h-full flex-col">
            {/* The rule spans the window; only its contents sit on the rail. */}
            <div className="border-border shrink-0 border-b">
                <div className="rail flex h-11 flex-wrap items-center gap-x-3 gap-y-2">
                    <div className="bg-muted flex items-center gap-1 rounded-md p-0.5">
                        {(['write', 'preview'] as const).map((option) => (
                            <button
                                key={option}
                                type="button"
                                aria-pressed={view === option}
                                disabled={option === 'preview' && !canPreview}
                                onClick={() => setView(option)}
                                className={cn(
                                    'rounded-[5px] px-2.5 py-1 text-[12.5px] font-medium capitalize transition-colors disabled:opacity-40',
                                    view === option
                                        ? 'bg-background text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.06)]'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {option}
                            </button>
                        ))}
                    </div>

                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        {/* The value already says what it is. A caps label in front of it
              only adds weight. */}
                        <Select
                            value={typeOverride}
                            onValueChange={(value) => {
                                onTypeOverride(value as PasteType | 'auto');

                                if (value !== 'code') {
                                    onLanguageOverride(null);
                                }
                            }}
                        >
                            <SelectTrigger
                                aria-label="Content type"
                                size="sm"
                                className="w-[9.5rem]"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="auto">
                                    Detect from text
                                </SelectItem>
                                <SelectItem value="text">Plain text</SelectItem>
                                <SelectItem value="markdown">
                                    Markdown
                                </SelectItem>
                                <SelectItem value="code">
                                    Source code
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {resolved.pasteType === 'code' && (
                            <Select
                                value={
                                    languageOverride ??
                                    resolved.language ??
                                    'typescript'
                                }
                                onValueChange={(value) =>
                                    onLanguageOverride(value)
                                }
                            >
                                <SelectTrigger
                                    aria-label="Language"
                                    size="sm"
                                    className="w-[8.5rem]"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGES.map((language) => (
                                        <SelectItem
                                            key={language.id}
                                            value={language.id}
                                        >
                                            {language.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>
            </div>

            {/* The canvas bleeds, but the text column stays on the rail: code set to
          the full width of a 1440px window is unreadable. */}
            {view === 'write' ? (
                <div className="min-h-0 flex-1">
                    <div className="rail h-full">
                        <Textarea
                            value={body}
                            onChange={(event) => onBody(event.target.value)}
                            spellCheck={false}
                            placeholder={
                                'Paste or type anything.\n\nMarkdown and source code are picked up on their own, and you can override the guess above.\n\nA Paste has no title. The body is the whole thing.'
                            }
                            className="h-full resize-none rounded-none border-0 bg-transparent px-0 py-5 font-mono text-[13px] leading-[1.65] shadow-none focus-visible:ring-0 md:text-[13px] dark:bg-transparent"
                        />
                    </div>
                </div>
            ) : (
                <div className="scrollbar-slim min-h-0 flex-1 overflow-auto">
                    <div className="rail py-5">
                        {resolved.pasteType === 'markdown' ? (
                            <MarkdownView body={body} />
                        ) : (
                            <CodeBlock
                                code={body}
                                language={resolved.language ?? 'text'}
                            />
                        )}
                    </div>
                </div>
            )}

            {dock}
        </div>
    );
}

/**
 * What the editor currently holds, in the mono register the system reserves for
 * machine truths. Sits on the left of the status bar, opposite the controls.
 */
export function PasteTruths({
    body,
    typeOverride,
    resolved,
}: {
    body: string;
    typeOverride: PasteType | 'auto';
    resolved: PasteDraft;
}) {
    const detection = useMemo(() => detectContent(body), [body]);
    const lines = body === '' ? 0 : body.split('\n').length;

    return (
        <span className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px]">
            <span>
                {lines} {lines === 1 ? 'line' : 'lines'} · {body.length} chars
            </span>
            <span className="flex items-center gap-1.5">
                <MagicWand className="size-3.5" />
                {typeOverride === 'auto'
                    ? detection.reason
                    : `Set by hand to ${TYPE_LABEL[resolved.pasteType].toLowerCase()}`}
            </span>
        </span>
    );
}
