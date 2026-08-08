import { usePage } from '@inertiajs/react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { AdminLayout } from '@/components/admin-layout';
import { AppProviders } from '@/components/app-providers';
import { Button } from '@/components/ui/button';
import type { UpdateStatus } from '@/lib/types';
import type { SharedPageProps } from '@/types';

function dateTime(value: string | number | null) {
    if (value === null) {
        return 'Not available';
    }

    const date = new Date(typeof value === 'number' ? value * 1000 : value);

    if (Number.isNaN(date.getTime())) {
        return 'Not available';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

function SystemRow({
    term,
    value,
    detail,
}: {
    term: string;
    value: string;
    detail?: string;
}) {
    return (
        <div className="grid gap-1 border-t border-border py-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-5">
            <dt className="text-[12.5px] text-muted-foreground">{term}</dt>
            <dd className="min-w-0">
                <p className="font-mono text-[12.5px] break-all">{value}</p>
                {detail && (
                    <p className="mt-1 max-w-[65ch] text-[12px] leading-relaxed text-muted-foreground">
                        {detail}
                    </p>
                )}
            </dd>
        </div>
    );
}

function VersionStatus({ update }: { update: UpdateStatus }) {
    const releaseState = update.updateAvailable
        ? `${update.latestVersion} available`
        : update.latestVersion === null
          ? 'No release information'
          : 'Up to date';

    return (
        <>
            <header>
                <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
                    System
                </h2>
                <p className="mt-1.5 max-w-[62ch] text-[13px] leading-relaxed text-muted-foreground">
                    Build identity and release status for this installation.
                    Updates are installed by the deployment platform, never by
                    Dōzobin itself.
                </p>
            </header>

            <dl>
                <SystemRow
                    term="Installed version"
                    value={update.currentVersion}
                />
                <SystemRow
                    term="Source commit"
                    value={update.currentCommit ?? 'Development build'}
                />
                <SystemRow
                    term="Image built"
                    value={dateTime(update.builtAt)}
                />
                <SystemRow
                    term="Release status"
                    value={releaseState}
                    detail={
                        update.checksEnabled
                            ? `Last checked ${dateTime(update.checkedAt)}. GitHub is queried at most once every 24 hours.`
                            : 'Update checks are disabled for this deployment or development build.'
                    }
                />
            </dl>

            {update.updateAvailable && update.releaseUrl !== null && (
                <div className="border-t border-border pt-4">
                    <Button size="sm" asChild>
                        <a
                            href={update.releaseUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            View {update.latestVersion} on GitHub
                            <ArrowUpRight aria-hidden />
                        </a>
                    </Button>
                </div>
            )}
        </>
    );
}

export default function SystemPage() {
    const update = usePage<SharedPageProps>().props.update;

    return (
        <AppProviders>
            <AdminLayout>
                {update === null ? (
                    <p className="text-[13px] text-muted-foreground">
                        Release status is available to administrators only.
                    </p>
                ) : (
                    <VersionStatus update={update} />
                )}
            </AdminLayout>
        </AppProviders>
    );
}
