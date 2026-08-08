import { useForm, usePage } from '@inertiajs/react';
import {
    ArrowClockwise,
    CheckCircle,
    WarningCircle,
    XCircle,
} from '@phosphor-icons/react';
import { AppProviders } from '@/components/app-providers';
import { InstallShell } from '@/components/install-shell';
import { Button } from '@/components/ui/button';
import type { InstallDatabaseStatus, InstallRequirement } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

function Verdict({
    ok,
    label,
    detail,
}: {
    ok: boolean;
    label: string;
    detail: string;
}) {
    const Icon = ok ? CheckCircle : WarningCircle;

    return (
        <div className="flex items-start gap-2.5 py-2">
            <Icon
                weight="fill"
                aria-hidden
                className={cn(
                    'mt-px size-4 shrink-0',
                    ok ? 'text-primary' : 'text-destructive',
                )}
            />
            <div className="min-w-0">
                <p className="text-[13px]">{label}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                    {detail}
                </p>
            </div>
        </div>
    );
}

/**
 * Reading the connection back is the point of this step: when it fails, the
 * fix is in the environment the container was started with, not in here.
 */
function ConnectionCard({ database }: { database: InstallDatabaseStatus }) {
    const target =
        database.host === null
            ? database.database
            : `${database.host}:${database.port ?? ''} · ${database.database}`;

    return (
        <div className="rounded-lg border border-border bg-card">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-4 py-3">
                {database.connected ? (
                    <CheckCircle
                        weight="fill"
                        aria-hidden
                        className="size-4 text-primary"
                    />
                ) : (
                    <XCircle
                        weight="fill"
                        aria-hidden
                        className="size-4 text-destructive"
                    />
                )}
                <p className="text-[13px] font-medium">
                    {database.connected
                        ? 'Connected'
                        : 'No connection to the database'}
                </p>
                <p className="ml-auto font-mono text-[11.5px] text-muted-foreground">
                    {database.driver}
                </p>
            </div>

            <dl className="grid gap-x-6 gap-y-2 px-4 py-3 font-mono text-[11.5px] sm:grid-cols-[6rem_minmax(0,1fr)]">
                <dt className="text-muted-foreground">target</dt>
                <dd className="break-all">{target || '—'}</dd>
                <dt className="text-muted-foreground">connection</dt>
                <dd>{database.connection}</dd>
                <dt className="text-muted-foreground">schema</dt>
                <dd>
                    {database.migrated
                        ? 'up to date'
                        : `${database.pendingMigrations.length} migration${
                              database.pendingMigrations.length === 1 ? '' : 's'
                          } outstanding`}
                </dd>
            </dl>

            {database.error !== null && (
                <p className="border-t border-border bg-sunken px-4 py-3 font-mono text-[11.5px] leading-relaxed break-all text-destructive">
                    {database.error}
                </p>
            )}
        </div>
    );
}

function DatabaseContent({
    database,
    requirements,
}: {
    database: InstallDatabaseStatus;
    requirements: InstallRequirement[];
}) {
    // The migrator reports through the shared error bag rather than a field,
    // because this step submits nothing. Success is not flashed back: running
    // the migrations is what gives the database a sessions table, so anything
    // put in the session here is written to a store the next request has
    // already stopped reading. The connection card says the same thing anyway.
    const { errors } = usePage<SharedPageProps>().props;
    const form = useForm({});
    const blocked = requirements.some((check) => !check.satisfied);
    const failure =
        typeof errors.database === 'string' ? errors.database : undefined;

    return (
        <InstallShell
            step="database"
            title="Check the environment"
            intro="Dōzobin reads its database credentials from the environment it was started with. Nothing on this page writes to that environment, so a failure here is fixed in your compose file or .env and then rechecked."
        >
            <ConnectionCard database={database} />

            {failure !== undefined && (
                <p className="flex items-start gap-1.5 text-[12.5px] text-destructive">
                    <WarningCircle
                        weight="fill"
                        aria-hidden
                        className="mt-px size-3.5 shrink-0"
                    />
                    {failure}
                </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => form.get('/install/database')}
                >
                    <ArrowClockwise /> Check again
                </Button>
                <Button
                    size="sm"
                    disabled={!database.connected || blocked || form.processing}
                    onClick={() =>
                        form.post('/install/database', {
                            preserveScroll: true,
                        })
                    }
                >
                    {/* A reachable database with an unreadable migration state
                        leaves the count at zero, so do not promise a number. */}
                    {database.pendingMigrations.length === 0
                        ? 'Set up the schema'
                        : `Run ${database.pendingMigrations.length} migration${
                              database.pendingMigrations.length === 1 ? '' : 's'
                          }`}
                </Button>
            </div>

            <div className="border-t border-border pt-3">
                <p className="label-mono">Requirements</p>
                <div className="mt-1.5 divide-y divide-border">
                    {requirements.map((check) => (
                        <Verdict
                            key={check.label}
                            ok={check.satisfied}
                            label={check.label}
                            detail={check.detail}
                        />
                    ))}
                </div>
            </div>
        </InstallShell>
    );
}

export default function InstallDatabasePage({
    database,
    requirements,
}: {
    database: InstallDatabaseStatus;
    requirements: InstallRequirement[];
}) {
    return (
        <AppProviders>
            <DatabaseContent database={database} requirements={requirements} />
        </AppProviders>
    );
}
