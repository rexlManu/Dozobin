import { Wordmark } from '@/components/brand';
import { Dozo } from '@/components/dozo';
import type { DozoMood } from '@/components/dozo';
import { NightCity, NightSky } from '@/components/night-sky';
import { Link } from '@/lib/navigation';
import { cn } from '@/lib/utils';

/** Bold, underlined link for the footer line under an auth card. */
export const authLinkClass =
    'font-bold text-foreground underline decoration-border-strong underline-offset-4 hover:decoration-foreground';

/**
 * A soft card with a head band, with Dozo sitting on the edge of the band.
 * Shared by the sign-in pages and the installer.
 */
export function SkyCard({
    band,
    greeting,
    mood = 'happy',
    className,
    children,
}: {
    /** Content on the left of the sky, usually the wordmark. */
    band: React.ReactNode;
    /** Short line in Dozo's speech bubble. Hidden on very narrow screens. */
    greeting?: string;
    mood?: DozoMood;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <section
            className={cn(
                'relative rounded-[28px] border-[1.5px] border-border bg-card',
                className,
            )}
        >
            <div className="h-28 border-b-[1.5px] border-border px-[18px] pt-4 sm:px-[26px]">
                {band}
            </div>
            <div
                aria-hidden
                className="absolute top-[54px] right-4 flex items-end gap-2 sm:right-6"
            >
                {greeting !== undefined && (
                    <span className="mb-10 hidden rounded-[18px_18px_4px_18px] bg-foreground px-3 py-1.5 text-[14px] font-bold whitespace-nowrap text-night min-[360px]:block">
                        {greeting}
                    </span>
                )}
                <Dozo size={80} mood={mood} />
            </div>
            <div className="px-[18px] pt-7 pb-[22px] sm:px-[26px] sm:pb-[26px]">
                {children}
            </div>
        </section>
    );
}

/** Centered sign-in, registration and reset card under the night sky. */
export function AuthPanel({
    title,
    intro,
    greeting,
    mood,
    children,
    footer,
}: {
    title: string;
    intro: string;
    greeting?: string;
    mood?: DozoMood;
    children: React.ReactNode;
    footer: React.ReactNode;
}) {
    return (
        <div className="relative isolate flex min-h-[100dvh] flex-col">
            <NightSky />
            <div className="mx-auto flex w-full max-w-[27rem] flex-1 flex-col justify-center px-4 py-10 sm:py-16">
                <SkyCard
                    greeting={greeting}
                    mood={mood}
                    band={
                        <Link
                            to="/"
                            aria-label="Dōzobin home"
                            className="block w-fit rounded-[14px]"
                        >
                            <Wordmark />
                        </Link>
                    }
                >
                    <h1 className="text-[28px] leading-tight font-bold text-balance">
                        {title}
                    </h1>
                    <p className="mt-2 text-muted-foreground">{intro}</p>
                    <div className="mt-6">{children}</div>
                </SkyCard>
                <div className="mt-5 text-center text-[14px] text-muted-foreground">
                    {footer}
                </div>
            </div>
            <NightCity />
        </div>
    );
}
