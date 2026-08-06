import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '@/components/code-block';
import { cn } from '@/lib/utils';

/**
 * Prose styling is written out rather than pulled from a typography plugin so
 * the rendered Markdown sits on the same scale as the rest of the app.
 */
export function MarkdownView({
    body,
    className,
}: {
    body: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'text-foreground max-w-[70ch] text-[15px] leading-[1.7]',
                '[&>*+*]:mt-4',
                '[&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-[-0.02em] first:[&_h1]:mt-0',
                '[&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-[-0.015em]',
                '[&_h3]:mt-6 [&_h3]:text-[15px] [&_h3]:font-semibold',
                '[&_p]:text-foreground/90',
                '[&_a]:decoration-border-strong hover:[&_a]:decoration-foreground [&_a]:underline [&_a]:underline-offset-4',
                '[&_li]:text-foreground/90 [&_li]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5',
                '[&_blockquote]:border-primary [&_blockquote]:text-muted-foreground [&_blockquote]:border-l-2 [&_blockquote]:pl-4',
                '[&_hr]:border-border',
                '[&_table]:w-full [&_table]:border-collapse [&_table]:text-sm',
                '[&_th]:border-border-strong [&_th]:border-b [&_th]:pb-2 [&_th]:text-left [&_th]:font-medium',
                '[&_td]:border-border [&_td]:border-b [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top',
                '[&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:rounded-sm [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.85em]',
                className,
            )}
        >
            <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ className: codeClass, children, ...props }) {
                        const match = /language-(\w+)/.exec(codeClass ?? '');
                        const text = String(children).replace(/\n$/, '');

                        if (!match) {
                            return (
                                <code className={codeClass} {...props}>
                                    {children}
                                </code>
                            );
                        }

                        return (
                            <div className="border-border bg-card overflow-hidden rounded-lg border">
                                <CodeBlock
                                    code={text}
                                    language={match[1]}
                                    lineNumbers={false}
                                />
                            </div>
                        );
                    },
                    pre({ children }) {
                        return <>{children}</>;
                    },
                }}
            >
                {body}
            </Markdown>
        </div>
    );
}
