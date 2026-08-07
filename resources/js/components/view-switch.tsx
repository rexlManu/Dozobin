import { Rows, SquaresFour } from '@phosphor-icons/react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type View = 'list' | 'grid';

/**
 * Two views with two different jobs: the list is for reading columns of size
 * and expiry across many shares, the grid is for recognising an upload by
 * looking at it. Icon-only, because the two shapes say it faster than words.
 *
 * Shared by the member Library and the administrator's uploads tables, so the
 * control means the same thing wherever a pile of shares is on screen.
 */
export function ViewSwitch({
    view,
    onView,
}: {
    view: View;
    onView: (next: View) => void;
}) {
    const options: {
        id: View;
        label: string;
        icon: React.ComponentType<{ className?: string }>;
    }[] = [
        { id: 'list', label: 'List view', icon: Rows },
        { id: 'grid', label: 'Grid view', icon: SquaresFour },
    ];

    return (
        <div className="inline-flex rounded-md bg-muted p-0.5">
            {options.map((option) => (
                <Tooltip key={option.id}>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            aria-pressed={view === option.id}
                            aria-label={option.label}
                            onClick={() => onView(option.id)}
                            className={cn(
                                'rounded-[5px] px-2 py-1.5 transition-colors',
                                view === option.id
                                    ? 'bg-background text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.07)]'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <option.icon className="size-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>{option.label}</TooltipContent>
                </Tooltip>
            ))}
        </div>
    );
}
