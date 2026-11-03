import { Check } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { SkyCard } from '@/components/auth-panel';
import { Wordmark } from '@/components/brand';
import { SkyBackdrop } from '@/components/night-sky';
import type { InstallStepKey } from '@/lib/types';
import { cn } from '@/lib/utils';

const STEPS: { key: InstallStepKey; label: string }[] = [
    { key: 'database', label: 'Database' },
    { key: 'account', label: 'Administrator' },
    { key: 'settings', label: 'Settings' },
];

/** The three installer steps as soft chips: done in mint, current in lavender. */
function StepChips({ current }: { current: InstallStepKey }) {
    const currentIndex = STEPS.findIndex((step) => step.key === current);

    return (
        <ol aria-label="Installation steps" className="flex flex-wrap gap-1.5">
            {STEPS.map((step, index) => {
                const done = index < currentIndex;
                const active = index === currentIndex;

                return (
                    <li
                        key={step.key}
                        aria-current={active ? 'step' : undefined}
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-[13px] border-[1.5px] px-3 py-1.5 text-[14px] font-bold',
                            active
                                ? 'border-lavender bg-lavender text-night'
                                : done
                                  ? 'border-transparent bg-mint-soft text-mint'
                                  : 'border-border text-muted-foreground',
                        )}
                    >
                        {done ? (
                            <Check
                                weight="bold"
                                aria-hidden
                                className="size-3.5"
                            />
                        ) : (
                            <span aria-hidden className="tabular-nums">
                                {index + 1}
                            </span>
                        )}
                        {step.label}
                        {done && <span className="sr-only">(done)</span>}
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
    const stepNumber = STEPS.findIndex((item) => item.key === step) + 1;

    return (
        <div className="relative isolate flex min-h-[100dvh] flex-col bg-background">
            <SkyBackdrop />
            <div className="mx-auto w-full max-w-[46rem] flex-1 px-4 py-10 sm:py-14">
                <StepChips current={step} />

                <SkyCard
                    className="mt-4"
                    mood="calm"
                    greeting={`Step ${stepNumber} of ${STEPS.length}`}
                    band={
                        <div className="grid gap-1">
                            <Wordmark />
                            <span className="text-[14px] font-bold text-lamp">
                                Installation
                            </span>
                        </div>
                    }
                >
                    <h1 className="text-[28px] leading-tight font-bold text-balance">
                        {title}
                    </h1>
                    <p className="mt-2 max-w-[60ch] text-muted-foreground">
                        {intro}
                    </p>
                    <div className="mt-6 flex flex-col gap-6">{children}</div>
                </SkyCard>
            </div>
        </div>
    );
}
