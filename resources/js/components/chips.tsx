import { cn } from '@/lib/utils';

export interface ChipOption<T extends string> {
    value: T;
    label: React.ReactNode;
    /** Shown as a tooltip when the option is not available here. */
    disabledReason?: string;
}

/**
 * A row of soft choice chips; the pressed one glows in lamplight. Used for
 * small single choices such as expiry, password on or off, and list filters.
 */
export function ChipGroup<T extends string>({
    label,
    value,
    options,
    onChange,
    className,
}: {
    label: string;
    value: T;
    options: ChipOption<T>[];
    onChange: (value: T) => void;
    className?: string;
}) {
    return (
        <div
            role="group"
            aria-label={label}
            className={cn('flex flex-wrap gap-1.5', className)}
        >
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    aria-pressed={value === option.value}
                    disabled={option.disabledReason !== undefined}
                    title={option.disabledReason}
                    onClick={() => onChange(option.value)}
                    className={cn(
                        'rounded-[13px] border-[1.5px] px-3 py-1.5 text-[14px] font-bold transition-[transform,color,border-color] duration-200 ease-bounce disabled:cursor-not-allowed disabled:opacity-35',
                        value === option.value
                            ? '-translate-y-px border-lamp bg-lamp text-warn-foreground'
                            : 'border-border text-muted-foreground enabled:hover:border-border-strong enabled:hover:text-foreground',
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
