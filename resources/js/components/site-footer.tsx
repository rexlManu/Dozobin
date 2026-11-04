import { usePage } from '@inertiajs/react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { Wordmark } from '@/components/brand';
import { Link } from '@/lib/navigation';
import type { SharedPageProps } from '@/types';

type FooterLink = { to: string; label: string };

function FooterColumn({
    title,
    links,
}: {
    title: string;
    links: FooterLink[];
}) {
    return (
        <nav aria-label={title} className="grid content-start gap-2.5">
            <h2 className="label-meta">{title}</h2>
            {links.map((link) => (
                <Link
                    key={link.to}
                    to={link.to}
                    className="w-fit font-bold text-foreground/85 transition-colors hover:text-foreground"
                >
                    {link.label}
                </Link>
            ))}
        </nav>
    );
}

/**
 * The street under the city: it starts in the colour of the building bases,
 * so the page ends on solid ground. Links follow the visitor's role.
 */
export function SiteFooter() {
    const { auth, name, serverNow, sourceUrl } =
        usePage<SharedPageProps>().props;
    const signedIn = auth.user !== null;
    const admin = auth.user?.role === 'admin';

    const share: FooterLink[] = [
        { to: '/', label: 'Send' },
        { to: '/transfer', label: 'Transfer' },
    ];

    if (signedIn) {
        share.push({ to: '/library', label: 'Library' });
    }

    const account: FooterLink[] = !signedIn
        ? [
              { to: '/signin', label: 'Sign in' },
              { to: '/register', label: 'Create account' },
          ]
        : [
              { to: '/settings', label: 'Settings' },
              { to: '/settings/tokens', label: 'API tokens' },
          ];

    if (admin) {
        account.push({ to: '/admin', label: 'Administration' });
    }

    return (
        <footer className="bg-linear-to-b from-[#100c16] to-[#06050d] to-60% pb-24 md:pb-0">
            <div className="rail grid grid-cols-2 gap-8 pt-8 pb-10 sm:grid-cols-[minmax(0,1.6fr)_1fr_1fr] sm:pt-10">
                <div className="col-span-2 grid content-start gap-3 sm:col-span-1">
                    <Wordmark />
                    <p className="max-w-[34ch] text-muted-foreground">
                        Files, text and Transfer Sessions. Every link is
                        unlisted and can expire.
                    </p>
                </div>
                <FooterColumn title="Share" links={share} />
                <FooterColumn title="Account" links={account} />
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
