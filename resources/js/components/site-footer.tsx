import { usePage } from '@inertiajs/react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { Wordmark } from '@/components/brand';
import { useOrigin } from '@/hooks/use-origin';
import { Link } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

/** A Share URL path: `/s/<slug>` or `/p/<slug>`. */
const SHARE_PATH = /^\/[sp]\/[A-Za-z0-9]+$/;

/**
 * The street under the city: it starts in the colour of the building bases,
 * so the page ends on solid ground. It holds the legal pages and the takedown
 * form. On a share page, "Report content" carries that page's link.
 */
export function SiteFooter({
    phoneNav = true,
}: {
    /** Leave room for the phone's bottom nav. */
    phoneNav?: boolean;
}) {
    const page = usePage<SharedPageProps>();
    const { name, serverNow, sourceUrl } = page.props;
    const origin = useOrigin('');
    const path = page.url.split('?')[0];
    const report =
        SHARE_PATH.test(path) && origin !== ''
            ? `/takedown?url=${encodeURIComponent(origin + path)}`
            : '/takedown';

    const links = [
        { to: '/terms', label: 'Terms of Service' },
        { to: '/privacy', label: 'Privacy Policy' },
        { to: report, label: 'Report content' },
    ];

    return (
        <footer
            className={cn(
                'bg-linear-to-b from-[#100c16] to-[#06050d] to-60%',
                phoneNav && 'pb-24 md:pb-0',
            )}
        >
            <div className="rail flex flex-col gap-6 pt-8 pb-9 sm:flex-row sm:items-start sm:justify-between sm:pt-10">
                <div className="grid content-start gap-3">
                    <Wordmark />
                    <p className="max-w-[34ch] text-muted-foreground">
                        Files, text and Transfer Sessions. Every link is
                        unlisted and can expire.
                    </p>
                </div>
                <nav
                    aria-label="Legal"
                    className="flex flex-wrap gap-x-6 gap-y-2.5 sm:flex-col sm:items-end"
                >
                    {links.map((link) => (
                        <Link
                            key={link.label}
                            to={link.to}
                            className="w-fit font-bold text-foreground/85 transition-colors hover:text-foreground"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="rail">
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-white/[0.06] py-5 text-[13px] text-muted-foreground">
                    <span>
                        © {new Date(serverNow).getFullYear()} {name}
                    </span>
                    <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold transition-colors hover:text-foreground"
                    >
                        Runs on Dōzobin, open source
                        <ArrowUpRight
                            aria-hidden
                            weight="bold"
                            className="size-3.5"
                        />
                    </a>
                </div>
            </div>
        </footer>
    );
}
