import { Check, Copy } from '@phosphor-icons/react';
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
        area.select();
        const ok = document.execCommand('copy');
        area.remove();

        return ok;
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
    const [copied, setCopied] = useState(false);
    const timer = useRef<number | undefined>(undefined);

    useEffect(() => () => window.clearTimeout(timer.current), []);

    const isIcon = typeof size === 'string' && size.startsWith('icon');

    return (
        <Button
            type="button"
            variant={variant}
            size={size}
            aria-label={isIcon ? label : undefined}
            className={cn(className)}
            onClick={async () => {
                await writeClipboard(value);
                setCopied(true);
                window.clearTimeout(timer.current);
                timer.current = window.setTimeout(() => setCopied(false), 1600);
            }}
            {...rest}
        >
            {copied ? (
                <Check weight="bold" className="text-primary" />
            ) : (
                <Copy />
            )}
            {!isIcon && <span>{copied ? copiedLabel : label}</span>}
        </Button>
    );
}
