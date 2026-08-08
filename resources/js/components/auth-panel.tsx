import { Wordmark } from '@/components/brand';
import { Link } from '@/lib/navigation';

export function AuthPanel({
    title,
    intro,
    children,
    footer,
}: {
    title: string;
    intro: string;
    children: React.ReactNode;
    footer: React.ReactNode;
}) {
    return (
        <div className="flex min-h-[100dvh] flex-col bg-background">
            <div className="mx-auto flex w-full max-w-[24.5rem] flex-1 flex-col justify-center px-4 py-12 sm:py-16">
                <Link
                    to="/"
                    aria-label="Dōzobin home"
                    className="mb-9 w-fit rounded-md focus-visible:outline-2"
                >
                    <Wordmark />
                </Link>
                <h1 className="text-xl font-medium tracking-[-0.02em]">
                    {title}
                </h1>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                    {intro}
                </p>
                <div className="mt-7">{children}</div>
                <div className="mt-6 border-t border-border pt-4 text-[13px] text-muted-foreground">
                    {footer}
                </div>
            </div>
        </div>
    );
}
