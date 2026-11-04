import { useEffect, useState } from 'react';
import type { HighlighterCore } from 'shiki/core';
import { cn } from '@/lib/utils';

/*
  Built from shiki/core with the grammars listed by hand rather than the full
  bundle. The regex engine is the JavaScript one, which keeps the 600 kB
  Oniguruma wasm out of the build for the fourteen languages this app offers.
*/
let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
    if (!highlighterPromise) {
        highlighterPromise = Promise.all([
            import('shiki/core'),
            import('@shikijs/engine-javascript'),
        ]).then(([core, engine]) =>
            core.createHighlighterCore({
                // One pastel theme to match the single Yoru palette.
                themes: [import('@shikijs/themes/catppuccin-mocha')],
                langs: [
                    import('@shikijs/langs/typescript'),
                    import('@shikijs/langs/javascript'),
                    import('@shikijs/langs/tsx'),
                    import('@shikijs/langs/python'),
                    import('@shikijs/langs/php'),
                    import('@shikijs/langs/go'),
                    import('@shikijs/langs/rust'),
                    import('@shikijs/langs/sql'),
                    import('@shikijs/langs/bash'),
                    import('@shikijs/langs/json'),
                    import('@shikijs/langs/yaml'),
                    import('@shikijs/langs/html'),
                    import('@shikijs/langs/css'),
                    import('@shikijs/langs/diff'),
                ],
                engine: engine.createJavaScriptRegexEngine({ forgiving: true }),
            }),
        );
    }

    return highlighterPromise;
}

interface CodeBlockProps {
    code: string;
    language: string;
    lineNumbers?: boolean;
    wrap?: boolean;
    className?: string;
}

export function CodeBlock({
    code,
    language,
    lineNumbers = true,
    wrap = false,
    className,
}: CodeBlockProps) {
    const highlightKey = `${language}\u0000${code}`;
    const [highlight, setHighlight] = useState<{
        key: string;
        html: string;
    } | null>(null);

    useEffect(() => {
        let active = true;
        getHighlighter()
            .then((highlighter) => {
                if (!active) {
                    return;
                }

                const known = highlighter
                    .getLoadedLanguages()
                    .includes(language);
                setHighlight({
                    key: highlightKey,
                    html: highlighter.codeToHtml(code, {
                        lang: known ? language : 'text',
                        theme: 'catppuccin-mocha',
                    }),
                });
            })
            .catch(() => {
                if (active) {
                    setHighlight({ key: highlightKey, html: '' });
                }
            });

        return () => {
            active = false;
        };
    }, [code, language, highlightKey]);

    const html = highlight?.key === highlightKey ? highlight.html : null;

    const lines = code.replace(/\n$/, '').split('\n');
    // Wrapped lines and a separate gutter cannot stay aligned, so the gutter goes.
    const showNumbers = lineNumbers && !wrap;

    return (
        <div
            className={cn(
                // An absolute line height, so the smaller gutter numerals inherit
                // the same 22px rows as the code instead of drifting up.
                'relative flex text-[13px] leading-[1.375rem]',
                className,
            )}
        >
            {showNumbers && (
                <div
                    aria-hidden
                    className="shrink-0 bg-sunken/60 px-3 py-4 text-right font-mono text-[12px] text-muted-foreground/70 select-none"
                >
                    {lines.map((_, index) => (
                        <div key={index}>{index + 1}</div>
                    ))}
                </div>
            )}
            <div className="min-w-0 flex-1 scrollbar-slim overflow-x-auto">
                {html === null ? (
                    <pre className="px-4 py-4 font-mono text-muted-foreground/60">
                        <code>{code}</code>
                    </pre>
                ) : html === '' ? (
                    <pre className="px-4 py-4 font-mono">
                        <code>{code}</code>
                    </pre>
                ) : (
                    <div
                        className={cn(
                            '[&_code]:font-mono [&_pre]:!bg-transparent [&_pre]:px-4 [&_pre]:py-4',
                            wrap &&
                                '[&_code]:break-words [&_pre]:whitespace-pre-wrap',
                        )}
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                )}
            </div>
        </div>
    );
}
