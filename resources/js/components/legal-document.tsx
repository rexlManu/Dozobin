import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';

export interface LegalSection {
    title: string;
    body: ReactNode;
}

/**
 * A legal page: the title in the sky, then one card of numbered sections.
 * The text stays generic on purpose, so any operator can run it as is.
 */
export function LegalDocument({
    title,
    intro,
    sections,
}: {
    title: string;
    intro: ReactNode;
    sections: LegalSection[];
}) {
    return (
        <AppShell
            head={
                <div className="grid max-w-[46rem] gap-3">
                    <h1 className="text-[32px] leading-tight font-bold sm:text-[44px]">
                        {title}
                    </h1>
                    <p className="text-muted-foreground">{intro}</p>
                </div>
            }
        >
            <div className="rail pb-16">
                <article className="grid max-w-[46rem] gap-7 rounded-[28px] border-[1.5px] border-border bg-card p-[22px] sm:p-[34px]">
                    {sections.map((section, index) => (
                        <section key={section.title} className="grid gap-2.5">
                            <h2 className="flex gap-2.5 text-[19px] leading-snug font-bold">
                                <span className="text-lavender tabular-nums">
                                    {index + 1}.
                                </span>
                                {section.title}
                            </h2>
                            <div className="grid gap-2.5 leading-relaxed text-foreground/85 [&_li]:pl-1 [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-1.5 [&_ul]:pl-5">
                                {section.body}
                            </div>
                        </section>
                    ))}
                </article>
            </div>
        </AppShell>
    );
}
