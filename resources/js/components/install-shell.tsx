import type { ReactNode } from 'react';
import { Wordmark } from '@/components/brand';
import type { InstallStepKey } from '@/lib/types';
import { cn } from '@/lib/utils';

const STEPS: { key: InstallStepKey; label: string; hint: string }[] = [
    { key: 'database', label: 'Database', hint: 'Connection and schema' },
    { key: 'account', label: 'Administrator', hint: 'The first account' },
    { key: 'settings', label: 'Settings', hint: 'How sharing behaves' },
];

function StepRail({ current }: { current: InstallStepKey }) {
    const currentIndex = STEPS.findIndex((step) => step.key === current);

    return (
        <ol className="flex gap-1 lg:flex-col lg:gap-0">
            {STEPS.map((step, index) => {
                const done = index < currentIndex;
                const active = index === currentIndex;

                return (
                    <li
                        key={step.key}
                        className={cn(
                            'flex min-w-0 flex-1 items-start gap-2.5 border-t-2 pt-2.5 lg:flex-none lg:border-t-0 lg:border-l-2 lg:py-2.5 lg:pt-2.5 lg:pl-3.5',
                            active
                                ? 'border-primary'
                                : done
                                  ? 'border-border-strong'
                                  : 'border-border',
                        )}
                    >
                        <span
                            aria-hidden
                            className={cn(
                                'mt-px font-mono text-[11px] tabular-nums',
                                active
                                    ? 'text-foreground'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {done ? '✓' : index + 1}
                        </span>
                        <span className="min-w-0">
                            <span
                                className={cn(
                                    'block truncate text-[13px]',
                                    active
                                        ? 'font-medium text-foreground'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {step.label}
                            </span>
                            <span className="hidden text-[12px] text-muted-foreground lg:block">
                                {step.hint}
                            </span>
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

export function InstallShell({
    step,
    title,
    intro,
    children,
}: {
    step: InstallStepKey;
    title: string;
    intro: string;
    children: ReactNode;
}) {
    return (
        <div className="flex min-h-[100dvh] flex-col bg-background">
            <div className="mx-auto w-full max-w-[54rem] flex-1 px-4 py-10 sm:px-6 sm:py-14">
                <Wordmark />
                <p className="label-mono mt-6">Installation</p>

                <div className="mt-4 grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-12">
                    <div className="lg:sticky lg:top-14 lg:self-start">
                        <StepRail current={step} />
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-xl font-medium tracking-[-0.02em]">
                            {title}
                        </h1>
                        <p className="mt-2 max-w-[62ch] text-[13.5px] leading-relaxed text-muted-foreground">
                            {intro}
                        </p>
                        <div className="mt-7 flex flex-col gap-5">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
