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
        <li className="flex items-start gap-3 rounded-[18px] bg-sunken px-4 py-3">
            <Icon
                weight="fill"
                aria-hidden
                className={cn(
                    'mt-0.5 size-5 shrink-0',
                    ok ? 'text-mint' : 'text-destructive',
                )}
            />
            <div className="min-w-0 flex-1">
                <p className="font-bold">{label}</p>
                <p className="mt-0.5 text-[14px] text-muted-foreground">
                    {detail}
                </p>
            </div>
            <span
                className={cn(
                    'shrink-0 rounded-[10px] px-2 py-0.5 text-[13px] font-bold',
                    ok
                        ? 'bg-mint-soft text-mint'
                        : 'bg-destructive-soft text-destructive',
                )}
            >
                {ok ? 'Met' : 'Not met'}
            </span>
        </li>
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
        <div className="rounded-[20px] bg-sunken p-4">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                {database.connected ? (
                    <CheckCircle
                        weight="fill"
                        aria-hidden
                        className="size-5 text-mint"
                    />
                ) : (
                    <XCircle
                        weight="fill"
                        aria-hidden
                        className="size-5 text-destructive"
                    />
                )}
                <p
                    className={cn(
                        'font-bold',
                        database.connected ? 'text-mint' : 'text-destructive',
                    )}
                >
                    {database.connected
                        ? 'Connected'
                        : 'No connection to the database'}
                </p>
                <p className="ml-auto font-mono text-[13px] text-muted-foreground">
                    {database.driver}
                </p>
            </div>

            <dl className="mt-3 grid gap-x-6 gap-y-2 text-[14px] sm:grid-cols-[7rem_minmax(0,1fr)]">
                <dt className="label-meta">Target</dt>
                <dd className="font-mono text-[13px] break-all">
                    {target || 'Not set'}
                </dd>
                <dt className="label-meta">Connection</dt>
                <dd className="font-mono text-[13px]">{database.connection}</dd>
                <dt className="label-meta">Schema</dt>
                <dd>
                    {database.migrated
                        ? 'Up to date'
                        : `${database.pendingMigrations.length} migration${
                              database.pendingMigrations.length === 1 ? '' : 's'
                          } outstanding`}
                </dd>
            </dl>

            {database.error !== null && (
                <p className="mt-3 rounded-[14px] bg-background px-3.5 py-3 font-mono text-[13px] leading-relaxed break-all text-destructive">
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
            intro="Dōzobin reads the database credentials from its environment. This page changes nothing there, so fix a failure in your compose file or .env and check again."
        >
            <ConnectionCard database={database} />

            {failure !== undefined && (
                <p className="flex items-start gap-2 text-[14px] font-bold text-destructive">
                    <WarningCircle
                        weight="fill"
                        aria-hidden
                        className="mt-0.5 size-4 shrink-0"
                    />
                    {failure}
                </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    variant="outline"
                    onClick={() => form.get('/install/database')}
                >
                    <ArrowClockwise /> Check again
                </Button>
                <Button
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

            <section>
                <h2 className="text-[18px] font-bold">Requirements</h2>
                <ul className="mt-3 grid gap-1.5">
                    {requirements.map((check) => (
                        <Verdict
                            key={check.label}
                            ok={check.satisfied}
                            label={check.label}
                            detail={check.detail}
                        />
                    ))}
                </ul>
            </section>
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
