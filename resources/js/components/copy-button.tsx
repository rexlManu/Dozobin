import { Check, Copy, WarningCircle } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ButtonProps = React.ComponentProps<typeof Button>;

interface CopyButtonProps extends Omit<ButtonProps, 'onClick' | 'value'> {
    value: string;
    label?: string;
    copiedLabel?: string;
}

async function writeClipboard(value: string) {
    try {
        await navigator.clipboard.writeText(value);

        return true;
    } catch {
        // Clipboard is blocked in some embedded contexts. Fall back to a selection.
        const area = document.createElement('textarea');
        area.value = value;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.append(area);

        try {
            area.select();

            return document.execCommand('copy');
        } catch {
            return false;
        } finally {
            area.remove();
        }
    }
}

export function CopyButton({
    value,
    label = 'Copy link',
    copiedLabel = 'Copied',
    className,
    variant = 'outline',
    size,
    ...rest
}: CopyButtonProps) {
    const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
    const timer = useRef<number | undefined>(undefined);

    useEffect(() => () => window.clearTimeout(timer.current), []);

    const isIcon = typeof size === 'string' && size.startsWith('icon');
    const stateLabel =
        state === 'copied'
            ? copiedLabel
            : state === 'failed'
              ? 'Copy failed'
              : label;

    return (
        <Button
            type="button"
            variant={variant}
            size={size}
            aria-label={isIcon ? stateLabel : undefined}
            className={cn(className)}
            onClick={async () => {
                const copied = await writeClipboard(value);
                setState(copied ? 'copied' : 'failed');
                window.clearTimeout(timer.current);
                timer.current = window.setTimeout(() => setState('idle'), 1600);
            }}
            aria-live="polite"
            {...rest}
        >
            {state === 'copied' ? (
                <Check weight="bold" className="text-primary" />
            ) : state === 'failed' ? (
                <WarningCircle weight="fill" className="text-destructive" />
            ) : (
                <Copy />
            )}
            {!isIcon && <span>{stateLabel}</span>}
        </Button>
    );
}
