import { useCallback, useRef, useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface ConfirmOptions {
    title: string;
    description: React.ReactNode;
    confirmLabel: string;
    cancelLabel?: string;
    tone?: 'danger' | 'neutral';
}

/**
 * One confirm surface for every irreversible act: deleting a share, clearing a
 * Transfer Item, revoking a token, ending a login session, deleting an account.
 */
export function useConfirm() {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const resolver = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((next: ConfirmOptions) => {
        setOptions(next);

        return new Promise<boolean>((resolve) => {
            resolver.current = resolve;
        });
    }, []);

    const settle = (value: boolean) => {
        resolver.current?.(value);
        resolver.current = null;
        setOptions(null);
    };

    const dialog = (
        <AlertDialog
            open={options !== null}
            onOpenChange={(open) => !open && settle(false)}
        >
            <AlertDialogContent className="max-w-[26rem]">
                <AlertDialogHeader>
                    <AlertDialogTitle>{options?.title}</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="text-muted-foreground text-sm leading-relaxed">
                            {options?.description}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => settle(false)}>
                        {options?.cancelLabel ?? 'Keep it'}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        variant={
                            options?.tone === 'neutral' ? 'default' : 'danger'
                        }
                        onClick={() => settle(true)}
                    >
                        {options?.confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    return { confirm, dialog };
}
