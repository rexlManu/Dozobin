import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * A select that reads as the value until you go near it.
 *
 * A table of ten rows with three bordered dropdowns each is thirty boxes and no
 * information. So the cell keeps rendering exactly what it rendered before —
 * the chip, the meter — and only grows a caret and a hover surface when the
 * pointer or keyboard focus arrives. The row stays readable; the control is
 * still there when wanted.
 *
 * Refusals are shown, not hidden: `disabledReason` leaves the trigger in place,
 * disabled, and explains itself on hover.
 */
export function InlineSelect<T extends string>({
    value,
    onChange,
    options,
    label,
    disabledReason,
    align = 'start',
    children,
}: {
    value: T;
    onChange: (next: T) => void;
    options: { value: T; label: string }[];
    /** Names the control for screen readers, since the trigger is a rendered chip. */
    label: string;
    disabledReason?: string | null;
    align?: 'start' | 'end';
    /** What the cell looks like at rest. */
    children: React.ReactNode;
}) {
    const trigger = (
        <SelectTrigger
            aria-label={label}
            disabled={Boolean(disabledReason)}
            className={cn(
                'h-auto w-fit gap-1 rounded-sm border-transparent bg-transparent px-1.5 py-1 text-[13px] dark:bg-transparent',
                'hover:bg-muted dark:hover:bg-muted',
                'data-[state=open]:border-border data-[state=open]:bg-muted',
                'disabled:opacity-100 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent',
                // The caret is the only affordance that appears; everything else about
                // the cell holds still, so nothing jumps as the pointer crosses the row.
                '[&>svg]:size-3 [&>svg]:opacity-0 [&>svg]:transition-opacity',
                'hover:[&>svg]:opacity-60 focus-visible:[&>svg]:opacity-60 data-[state=open]:[&>svg]:opacity-60',
                'disabled:[&>svg]:hidden',
            )}
        >
            {children}
        </SelectTrigger>
    );

    return (
        <Select value={value} onValueChange={(next) => onChange(next as T)}>
            {disabledReason ? (
                <Tooltip>
                    {/* A disabled trigger fires no pointer events, so the tooltip needs a
              live wrapper to hang off. */}
                    <TooltipTrigger asChild>
                        <span className="inline-flex cursor-not-allowed">
                            {trigger}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">{disabledReason}</TooltipContent>
                </Tooltip>
            ) : (
                trigger
            )}
            <SelectContent align={align} position="popper">
                {options.map((option) => (
                    <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-[13px]"
                    >
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
