import { Dozo } from '@/components/dozo';
import { cn } from '@/lib/utils';

/** Dozo's face plus the name. Used in every header. */
export function Wordmark({ className }: { className?: string }) {
    return (
        <span className={cn('flex items-center gap-2', className)}>
            <Dozo size={32} mood="happy" />
            <span className="text-[19px] font-bold tracking-[0.01em]">
                Dōzobin
            </span>
        </span>
    );
}
