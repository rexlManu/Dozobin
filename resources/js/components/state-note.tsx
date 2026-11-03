import type { DozoMood } from '@/components/dozo';
import { Dozo } from '@/components/dozo';

/**
 * A centered soft card with Dozo, for pages that hold no content right now:
 * expired, removed, locked or not found.
 */
export function StateNote({
    mood,
    title,
    children,
}: {
    mood: DozoMood;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="mx-auto w-full max-w-[30rem] px-4 pt-14 pb-20 sm:pt-20">
            <div className="grid justify-items-center gap-3.5 rounded-[28px] border-[1.5px] border-border bg-card px-6 py-8 text-center sm:px-8">
                <Dozo size={110} mood={mood} />
                <h1 className="text-[26px] leading-tight font-bold">{title}</h1>
                {children}
            </div>
        </div>
    );
}
