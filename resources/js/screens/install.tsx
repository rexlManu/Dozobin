import { useForm, usePage } from '@inertiajs/react';
import {
    ArrowClockwise,
    CheckCircle,
    WarningCircle,
    XCircle,
} from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Wordmark } from '@/components/brand';
import { Button } from '@/components/ui/button';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { EXPIRATION_LABEL } from '@/lib/format';
import type {
    AdminConfig,
    ExpirationKey,
    InstallDatabaseStatus,
    InstallRequirement,
    InstallStepKey,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

const STEPS: { key: InstallStepKey; label: string; hint: string }[] = [
    { key: 'database', label: 'Database', hint: 'Connection and schema' },
    { key: 'account', label: 'Administrator', hint: 'The first account' },
    { key: 'settings', label: 'Settings', hint: 'How sharing behaves' },
];

function StepRail({ current }: { current: InstallStepKey }) {
    const currentIndex = STEPS.findIndex((step) => step.key === current);

    return (
        <ol className="flex gap-1 lg:flex-col lg:gap-0">
            {STEPS.map((step, index) => {
                const done = index < currentIndex;
                const active = index === currentIndex;

                return (
                    <li
                        key={step.key}
                        className={cn(
                            'flex min-w-0 flex-1 items-start gap-2.5 border-t-2 pt-2.5 lg:flex-none lg:border-t-0 lg:border-l-2 lg:py-2.5 lg:pt-2.5 lg:pl-3.5',
                            active
                                ? 'border-primary'
                                : done
                                  ? 'border-border-strong'
                                  : 'border-border',
                        )}
                    >
                        <span
                            aria-hidden
                            className={cn(
                                'mt-px font-mono text-[11px] tabular-nums',
                                active
                                    ? 'text-foreground'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {done ? '✓' : index + 1}
                        </span>
                        <span className="min-w-0">
                            <span
                                className={cn(
                                    'block truncate text-[13px]',
                                    active
                                        ? 'font-medium text-foreground'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {step.label}
                            </span>
                            <span className="hidden text-[12px] text-muted-foreground lg:block">
                                {step.hint}
                            </span>
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

function InstallShell({
    step,
    title,
    intro,
    children,
}: {
    step: InstallStepKey;
    title: string;
    intro: string;
    children: ReactNode;
}) {
    return (
        <div className="flex min-h-[100dvh] flex-col bg-background">
            <div className="mx-auto w-full max-w-[54rem] flex-1 px-4 py-10 sm:px-6 sm:py-14">
                <Wordmark />
                <p className="label-mono mt-6">Installation</p>

                <div className="mt-4 grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-12">
                    <div className="lg:sticky lg:top-14 lg:self-start">
                        <StepRail current={step} />
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-xl font-medium tracking-[-0.02em]">
                            {title}
                        </h1>
                        <p className="mt-2 max-w-[62ch] text-[13.5px] leading-relaxed text-muted-foreground">
                            {intro}
                        </p>
                        <div className="mt-7 flex flex-col gap-5">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

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

export function DatabaseStep({
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

export function AccountStep() {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    return (
        <InstallShell
            step="account"
            title="Create the administrator"
            intro="This account owns Administration: every site setting, every Member, every upload on the server. It is the only account the installer creates, and this page closes as soon as it exists."
        >
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post('/install/account', {
                        onFinish: () =>
                            form.reset('password', 'password_confirmation'),
                    });
                }}
                className="max-w-[24.5rem]"
            >
                <FieldGroup>
                    <Field data-invalid={Boolean(form.errors.name)}>
                        <FieldLabel htmlFor="install-name">Name</FieldLabel>
                        <Input
                            id="install-name"
                            autoComplete="name"
                            value={form.data.name}
                            aria-invalid={Boolean(form.errors.name)}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                        />
                        <FieldError>{form.errors.name}</FieldError>
                    </Field>
                    <Field data-invalid={Boolean(form.errors.email)}>
                        <FieldLabel htmlFor="install-email">Email</FieldLabel>
                        <Input
                            id="install-email"
                            type="email"
                            autoComplete="email"
                            value={form.data.email}
                            aria-invalid={Boolean(form.errors.email)}
                            onChange={(event) =>
                                form.setData('email', event.target.value)
                            }
                        />
                        <FieldError>{form.errors.email}</FieldError>
                    </Field>
                    <Field data-invalid={Boolean(form.errors.password)}>
                        <FieldLabel htmlFor="install-password">
                            Password
                        </FieldLabel>
                        <Input
                            id="install-password"
                            type="password"
                            autoComplete="new-password"
                            value={form.data.password}
                            aria-invalid={Boolean(form.errors.password)}
                            onChange={(event) =>
                                form.setData('password', event.target.value)
                            }
                        />
                        <FieldError>{form.errors.password}</FieldError>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="install-confirmation">
                            Confirm password
                        </FieldLabel>
                        <Input
                            id="install-confirmation"
                            type="password"
                            autoComplete="new-password"
                            value={form.data.password_confirmation}
                            onChange={(event) =>
                                form.setData(
                                    'password_confirmation',
                                    event.target.value,
                                )
                            }
                        />
                    </Field>
                    <Button type="submit" size="lg" disabled={form.processing}>
                        Create administrator
                    </Button>
                </FieldGroup>
            </form>
        </InstallShell>
    );
}

function Row({
    label,
    hint,
    error,
    children,
}: {
    label: string;
    hint?: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2">
            <Label className="text-[13px]">{label}</Label>
            {hint !== undefined && (
                <p className="-mt-1 text-[12px] leading-relaxed text-muted-foreground">
                    {hint}
                </p>
            )}
            {children}
            {error !== undefined && (
                <p className="flex items-start gap-1.5 text-[12.5px] text-destructive">
                    <WarningCircle
                        weight="fill"
                        aria-hidden
                        className="mt-px size-3.5 shrink-0"
                    />
                    {error}
                </p>
            )}
        </div>
    );
}

/**
 * A subset on purpose. The wizard asks the questions whose wrong answer is
 * embarrassing on day one — who may upload, how big, how long — and leaves the
 * rest at its defaults for Administration.
 */
export function SettingsStep({ defaults }: { defaults: AdminConfig }) {
    const form = useForm<AdminConfig>({ ...defaults });
    const { data, setData, errors } = form;

    return (
        <InstallShell
            step="settings"
            title="Set the ground rules"
            intro="These apply to everyone on this server. Every one of them, plus the expiration choices and blocked file types, stays editable under Administration afterwards."
        >
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post('/install/settings');
                }}
                className="flex flex-col gap-6"
            >
                <div className="flex items-start gap-3">
                    <Switch
                        id="install-guest-sharing"
                        checked={data.guestSharing}
                        onCheckedChange={(checked) =>
                            setData('guestSharing', checked)
                        }
                    />
                    <div>
                        <Label
                            htmlFor="install-guest-sharing"
                            className="text-[13px]"
                        >
                            Guests may create shares
                        </Label>
                        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                            With this off, signed-out visitors are asked to sign
                            in. Transfer Sessions keep working either way.
                        </p>
                    </div>
                </div>

                <Row label="Member registration" error={errors.registration}>
                    <RadioGroup
                        value={data.registration}
                        onValueChange={(value) =>
                            setData(
                                'registration',
                                value as AdminConfig['registration'],
                            )
                        }
                        className="gap-2.5"
                    >
                        {(
                            [
                                [
                                    'open',
                                    'Open',
                                    'Anyone can create an account.',
                                ],
                                [
                                    'invite',
                                    'Invite only',
                                    'Registration needs the code in DOZOBIN_INVITE_CODE.',
                                ],
                                ['closed', 'Closed', 'No new accounts at all.'],
                            ] as const
                        ).map(([value, label, hint]) => (
                            <label
                                key={value}
                                htmlFor={`install-reg-${value}`}
                                className="flex cursor-pointer gap-2.5"
                            >
                                <RadioGroupItem
                                    id={`install-reg-${value}`}
                                    value={value}
                                    className="mt-0.5"
                                />
                                <span>
                                    <span className="block text-[13px]">
                                        {label}
                                    </span>
                                    <span className="block text-[12px] text-muted-foreground">
                                        {hint}
                                    </span>
                                </span>
                            </label>
                        ))}
                    </RadioGroup>
                </Row>

                <div className="grid gap-5 sm:grid-cols-2">
                    <Row
                        label="Default expiration for Guests"
                        error={errors.guestDefaultExpiration}
                    >
                        <Select
                            value={data.guestDefaultExpiration}
                            onValueChange={(value) =>
                                setData(
                                    'guestDefaultExpiration',
                                    value as ExpirationKey,
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {data.guestExpirations.map((key) => (
                                    <SelectItem key={key} value={key}>
                                        {EXPIRATION_LABEL[key]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Row>

                    <Row
                        label="Default expiration for Members"
                        error={errors.memberDefaultExpiration}
                    >
                        <Select
                            value={data.memberDefaultExpiration}
                            onValueChange={(value) =>
                                setData(
                                    'memberDefaultExpiration',
                                    value as ExpirationKey,
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {data.memberExpirations.map((key) => (
                                    <SelectItem key={key} value={key}>
                                        {EXPIRATION_LABEL[key]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Row>

                    <Row label="Maximum upload size" error={errors.maxUploadMb}>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min={1}
                                value={data.maxUploadMb}
                                aria-invalid={Boolean(errors.maxUploadMb)}
                                onChange={(event) =>
                                    setData(
                                        'maxUploadMb',
                                        Number(event.target.value),
                                    )
                                }
                                className="w-[9rem] font-mono"
                            />
                            <span className="font-mono text-[12px] text-muted-foreground">
                                MB per file
                            </span>
                        </div>
                    </Row>

                    <Row
                        label="Default Member quota"
                        hint="Applies to accounts created from here on."
                        error={errors.defaultQuotaMb}
                    >
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min={1}
                                value={data.defaultQuotaMb}
                                aria-invalid={Boolean(errors.defaultQuotaMb)}
                                onChange={(event) =>
                                    setData(
                                        'defaultQuotaMb',
                                        Number(event.target.value),
                                    )
                                }
                                className="w-[9rem] font-mono"
                            />
                            <span className="font-mono text-[12px] text-muted-foreground">
                                MB
                            </span>
                        </div>
                    </Row>
                </div>

                <Row
                    label="Transfer Session inactivity window"
                    hint="A session and everything in it is deleted this long after the last thing anyone does in it."
                    error={errors.transferWindowHours}
                >
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min={1}
                            max={168}
                            value={data.transferWindowHours}
                            aria-invalid={Boolean(errors.transferWindowHours)}
                            onChange={(event) =>
                                setData(
                                    'transferWindowHours',
                                    Number(event.target.value),
                                )
                            }
                            className="w-[9rem] font-mono"
                        />
                        <span className="font-mono text-[12px] text-muted-foreground">
                            hours
                        </span>
                    </div>
                </Row>

                <div className="flex items-start gap-3 border-t border-border pt-5">
                    <Switch
                        id="install-malware-scanning"
                        checked={data.malwareScanningEnabled}
                        onCheckedChange={(checked) =>
                            setData('malwareScanningEnabled', checked)
                        }
                    />
                    <div>
                        <Label
                            htmlFor="install-malware-scanning"
                            className="text-[13px]"
                        >
                            Scan new File Shares for malware
                        </Label>
                        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                            Needs a reachable clamd service. Leave this off if
                            you have not run one alongside Dōzobin yet.
                        </p>
                        {errors.malwareScanningEnabled !== undefined && (
                            <p className="mt-1 text-[12px] text-destructive">
                                {errors.malwareScanningEnabled}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <Button type="submit" size="lg" disabled={form.processing}>
                        Finish installation
                    </Button>
                </div>
            </form>
        </InstallShell>
    );
}
