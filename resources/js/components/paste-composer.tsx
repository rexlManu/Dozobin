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
        // A sheet of lined paper inside the Send card.
        <div className="flex flex-col overflow-hidden rounded-[24px] bg-sunken">
            <div className="shrink-0 px-3 pt-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <div className="flex items-center gap-1 rounded-[14px] bg-background/60 p-1">
                        {(['write', 'preview'] as const).map((option) => (
                            <button
                                key={option}
                                type="button"
                                aria-pressed={view === option}
                                disabled={option === 'preview' && !canPreview}
                                onClick={() => setView(option)}
                                className={cn(
                                    'rounded-[10px] px-3 py-1 text-[13px] font-bold capitalize transition-colors disabled:opacity-40',
                                    view === option
                                        ? 'bg-lavender text-night'
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
                <div>
                    <div className="px-5">
                        <Textarea
                            value={body}
                            onChange={(event) => onBody(event.target.value)}
                            spellCheck={false}
                            placeholder={
                                'Paste or type anything. No title needed.'
                            }
                            className="min-h-[260px] resize-y rounded-none border-0 bg-transparent bg-[repeating-linear-gradient(transparent_0_23px,rgb(185_168_255/0.08)_23px_24px)] bg-local bg-[position:0_13px] px-0 py-4 font-mono text-[14px] leading-[24px] shadow-none focus-visible:ring-0 md:text-[14px]"
                        />
                    </div>
                </div>
            ) : (
                <div className="max-h-[520px] scrollbar-slim overflow-auto">
                    <div className="px-5 py-4">
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
 * What the editor currently holds, as quiet metadata. Sits on the left of the
 * status bar, opposite the controls.
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
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
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
