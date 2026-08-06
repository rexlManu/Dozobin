import { CheckCircle, Plus, WarningCircle, X } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AppShell } from '@/components/app-shell';
import { useConfirm } from '@/components/confirm-dialog';
import { Countdown } from '@/components/expiry';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useNow } from '@/hooks/use-now';
import { EXPIRATION_LABEL, EXPIRATION_ORDER } from '@/lib/format';
import {
    Link,
    NavLink,
    Navigate,
    Outlet,
    useOutletContext,
} from '@/lib/navigation';
import type { AdminConfig, ExpirationKey } from '@/lib/types';
import { cn } from '@/lib/utils';
import { isTransferExpired, transferExpiresAt, useDozo } from '@/store/store';

type Errors = Partial<Record<keyof AdminConfig, string>>;

/** Which settings page owns each field, so the save bar can name the one to fix. */
const FIELD_SECTION: Partial<
    Record<keyof AdminConfig, { to: string; label: string }>
> = {
    guestSharing: { to: 'access', label: 'Access' },
    registration: { to: 'access', label: 'Access' },
    guestExpirations: { to: 'expiration', label: 'Expiration' },
    guestDefaultExpiration: { to: 'expiration', label: 'Expiration' },
    memberExpirations: { to: 'expiration', label: 'Expiration' },
    memberDefaultExpiration: { to: 'expiration', label: 'Expiration' },
    guestPasswordProtection: { to: 'expiration', label: 'Expiration' },
    defaultQuotaMb: { to: 'limits', label: 'Limits' },
    maxUploadMb: { to: 'limits', label: 'Limits' },
    fileTypeMode: { to: 'file-types', label: 'File types' },
    fileTypeList: { to: 'file-types', label: 'File types' },
    transferWindowHours: { to: 'transfer', label: 'Transfer sessions' },
};

function validate(draft: AdminConfig): Errors {
    const errors: Errors = {};

    if (draft.guestExpirations.length === 0) {
        errors.guestExpirations =
            'Guests need at least one expiration choice, or turn Guest sharing off.';
    } else if (!draft.guestExpirations.includes(draft.guestDefaultExpiration)) {
        errors.guestDefaultExpiration =
            'The default has to be one of the choices Guests get.';
    }

    if (draft.memberExpirations.length === 0) {
        errors.memberExpirations =
            'Members need at least one expiration choice.';
    } else if (
        !draft.memberExpirations.includes(draft.memberDefaultExpiration)
    ) {
        errors.memberDefaultExpiration =
            'The default has to be one of the choices Members get.';
    }

    if (!Number.isFinite(draft.maxUploadMb) || draft.maxUploadMb < 1) {
        errors.maxUploadMb = 'Give a size of at least 1 MB.';
    } else if (draft.maxUploadMb > 20480) {
        errors.maxUploadMb = '20480 MB is the ceiling this build accepts.';
    }

    if (!Number.isFinite(draft.defaultQuotaMb) || draft.defaultQuotaMb < 0) {
        errors.defaultQuotaMb =
            'Quotas cannot be negative. Use 0 for unlimited.';
    }

    if (
        !Number.isInteger(draft.transferWindowHours) ||
        draft.transferWindowHours < 1 ||
        draft.transferWindowHours > 168
    ) {
        errors.transferWindowHours =
            'Give a whole number of hours between 1 and 168.';
    }

    return errors;
}

function Field({
    label,
    hint,
    error,
    children,
}: {
    label: string;
    hint?: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2">
            <Label className="text-[13px]">{label}</Label>
            {hint && (
                <p className="text-muted-foreground -mt-1 text-[12px] leading-relaxed">
                    {hint}
                </p>
            )}
            {children}
            {error && (
                <p className="text-destructive flex items-start gap-1.5 text-[12.5px]">
                    <WarningCircle
                        weight="fill"
                        className="mt-px size-3.5 shrink-0"
                    />
                    {error}
                </p>
            )}
        </div>
    );
}

function PageHead({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <header>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
                {title}
            </h2>
            <p className="text-muted-foreground mt-1.5 max-w-[62ch] text-[13px] leading-relaxed">
                {description}
            </p>
        </header>
    );
}

function ExpirationChoices({
    value,
    onChange,
    idPrefix,
}: {
    value: ExpirationKey[];
    onChange: (next: ExpirationKey[]) => void;
    idPrefix: string;
}) {
    return (
        <div className="flex flex-wrap gap-x-5 gap-y-2.5">
            {EXPIRATION_ORDER.map((key) => (
                <label
                    key={key}
                    htmlFor={`${idPrefix}-${key}`}
                    className="flex cursor-pointer items-center gap-2 text-[13px]"
                >
                    <Checkbox
                        id={`${idPrefix}-${key}`}
                        checked={value.includes(key)}
                        onCheckedChange={(checked) =>
                            onChange(
                                checked === true
                                    ? EXPIRATION_ORDER.filter(
                                          (k) => k === key || value.includes(k),
                                      )
                                    : value.filter((k) => k !== key),
                            )
                        }
                    />
                    {EXPIRATION_LABEL[key]}
                </label>
            ))}
        </div>
    );
}

const NAV = [
    { to: 'users', label: 'Users' },
    { to: 'uploads', label: 'Uploads' },
    // "Sessions" rather than "Transfer sessions", because Site settings already
    // has an item by that name and two identical labels in one sidebar is a
    // coin toss. The page's own heading says the full thing.
    { to: 'sessions', label: 'Sessions' },
];

const SETTINGS_NAV = [
    { to: 'settings/access', label: 'Access' },
    { to: 'settings/expiration', label: 'Expiration' },
    { to: 'settings/limits', label: 'Limits' },
    { to: 'settings/file-types', label: 'File types' },
    { to: 'settings/transfer', label: 'Transfer sessions' },
    { to: 'settings/housekeeping', label: 'Housekeeping' },
];

function NavItem({ to, label }: { to: string; label: string }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    'relative shrink-0 px-2.5 py-2 text-[13px] transition-colors lg:py-1.5',
                    isActive
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground',
                )
            }
        >
            {({ isActive }) => (
                <>
                    {isActive && (
                        <span
                            aria-hidden
                            className="bg-foreground absolute inset-x-2 -bottom-px h-[1.5px] lg:inset-x-auto lg:inset-y-1 lg:-left-px lg:h-auto lg:w-[1.5px]"
                        />
                    )}
                    {label}
                </>
            )}
        </NavLink>
    );
}

export function AdminLayout() {
    // Judged on the impersonated role, not the real one, so the route agrees with
    // the nav: while viewing as a member you lose Admin from both. The banner's
    // Return is the way back. Guardrails still judge the real identity, so you
    // cannot delete yourself from inside an impersonation session.
    const role = useDozo((s) => s.role());

    if (role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return (
        <AppShell>
            <div className="rail py-6 sm:py-8">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h1 className="text-xl font-medium tracking-[-0.02em]">
                        Administration
                    </h1>
                    <p className="text-muted-foreground font-mono text-[11.5px]">
                        applies to everyone on this server
                    </p>
                </div>

                <div className="mt-6 grid gap-7 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
                    <nav className="border-border scrollbar-slim -mx-4 flex gap-1 overflow-x-auto border-b px-4 lg:sticky lg:top-20 lg:mx-0 lg:flex-col lg:gap-0.5 lg:self-start lg:overflow-visible lg:border-b-0 lg:border-l lg:px-0">
                        {NAV.map((item) => (
                            <NavItem key={item.to} {...item} />
                        ))}
                        <span aria-hidden className="hidden h-3 lg:block" />
                        <p className="label-mono shrink-0 self-center px-2.5 py-2 lg:self-start lg:py-1">
                            Site settings
                        </p>
                        {SETTINGS_NAV.map((item) => (
                            <NavItem key={item.to} {...item} />
                        ))}
                    </nav>

                    <div className="flex min-w-0 flex-col gap-5">
                        <Outlet />
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

interface SettingsContext {
    draft: AdminConfig;
    setDraft: (patch: Partial<AdminConfig>) => void;
    shown: (key: keyof AdminConfig) => string | undefined;
}

export function useAdminSettings() {
    return useOutletContext<SettingsContext>();
}

/**
 * The draft spans six pages, so the save bar has to live above all of them.
 * When something is invalid it names the page that owns the field, because a
 * bare "fix 1 field" is useless when the field is two clicks away.
 */
export function AdminSettingsLayout() {
    const draft = useDozo((s) => s.adminDraft);
    const config = useDozo((s) => s.adminConfig);
    const setDraft = useDozo((s) => s.setAdminDraft);
    const save = useDozo((s) => s.saveAdmin);
    const reset = useDozo((s) => s.resetAdmin);

    const [saved, setSaved] = useState(false);
    const [showErrors, setShowErrors] = useState(false);

    const errors = useMemo(() => validate(draft), [draft]);
    const dirty = JSON.stringify(draft) !== JSON.stringify(config);
    const invalid = Object.keys(errors).length > 0;

    useEffect(() => {
        if (!saved) {
            return;
        }

        const timer = window.setTimeout(() => setSaved(false), 2600);

        return () => window.clearTimeout(timer);
    }, [saved]);

    const shown = (key: keyof AdminConfig) =>
        showErrors ? errors[key] : undefined;
    const firstBad = (Object.keys(errors) as (keyof AdminConfig)[])[0];
    const badSection = firstBad ? FIELD_SECTION[firstBad] : undefined;

    return (
        <>
            <Outlet
                context={{ draft, setDraft, shown } satisfies SettingsContext}
            />

            <div className="border-border bg-background/85 sticky bottom-0 -mx-4 mt-2 border-t px-4 py-3 backdrop-blur-md sm:-mx-0 sm:px-0">
                <div className="flex flex-wrap items-center gap-3">
                    <p className="text-muted-foreground text-[12.5px]">
                        {saved ? (
                            <span className="text-foreground flex items-center gap-1.5">
                                <CheckCircle
                                    weight="fill"
                                    className="text-primary size-3.5"
                                />{' '}
                                Saved. The workspace picks it up immediately.
                            </span>
                        ) : showErrors && invalid && badSection ? (
                            <span className="text-destructive">
                                Fix {Object.keys(errors).length} field
                                {Object.keys(errors).length === 1
                                    ? ''
                                    : 's'} in{' '}
                                <Link
                                    to={`/admin/settings/${badSection.to}`}
                                    className="underline underline-offset-4"
                                >
                                    {badSection.label}
                                </Link>
                            </span>
                        ) : dirty ? (
                            'Unsaved changes'
                        ) : (
                            'No changes'
                        )}
                    </p>
                    <div className="ml-auto flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={!dirty}
                            onClick={() => reset()}
                        >
                            Discard
                        </Button>
                        <Button
                            size="sm"
                            disabled={!dirty}
                            onClick={() => {
                                if (invalid) {
                                    setShowErrors(true);

                                    return;
                                }

                                save();
                                setShowErrors(false);
                                setSaved(true);
                            }}
                        >
                            Save changes
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

export function AccessSettings() {
    const { draft, setDraft } = useAdminSettings();

    return (
        <>
            <PageHead
                title="Access"
                description="Guest sharing and registration are the two switches that decide who can put something on this installation."
            />
            <div className="flex items-start gap-3">
                <Switch
                    id="guest-sharing"
                    checked={draft.guestSharing}
                    onCheckedChange={(checked) =>
                        setDraft({ guestSharing: checked })
                    }
                />
                <div>
                    <Label htmlFor="guest-sharing" className="text-[13px]">
                        Guests may create shares
                    </Label>
                    <p className="text-muted-foreground mt-1 text-[12px] leading-relaxed">
                        With this off, the Drop Workspace asks signed-out
                        visitors to sign in. Transfer Sessions keep working
                        either way.
                    </p>
                </div>
            </div>

            <Field label="Member registration">
                <RadioGroup
                    value={draft.registration}
                    onValueChange={(value) =>
                        setDraft({
                            registration: value as AdminConfig['registration'],
                        })
                    }
                    className="gap-2.5"
                >
                    {(
                        [
                            ['open', 'Open', 'Anyone can create an account.'],
                            [
                                'invite',
                                'Invite only',
                                'Registration needs a code you hand out.',
                            ],
                            ['closed', 'Closed', 'No new accounts at all.'],
                        ] as const
                    ).map(([value, label, hint]) => (
                        <label
                            key={value}
                            htmlFor={`reg-${value}`}
                            className="flex cursor-pointer gap-2.5"
                        >
                            <RadioGroupItem
                                id={`reg-${value}`}
                                value={value}
                                className="mt-0.5"
                            />
                            <span>
                                <span className="block text-[13px]">
                                    {label}
                                </span>
                                <span className="text-muted-foreground block text-[12px]">
                                    {hint}
                                </span>
                            </span>
                        </label>
                    ))}
                </RadioGroup>
            </Field>
        </>
    );
}

export function ExpirationSettings() {
    const { draft, setDraft, shown } = useAdminSettings();

    return (
        <>
            <PageHead
                title="Expiration"
                description="Guests and Members can be offered different windows. Whatever you pick here is what the Drop Workspace shows."
            />
            <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-5">
                    <Field
                        label="Choices Guests get"
                        error={shown('guestExpirations')}
                    >
                        <ExpirationChoices
                            idPrefix="guest"
                            value={draft.guestExpirations}
                            onChange={(next) =>
                                setDraft({ guestExpirations: next })
                            }
                        />
                    </Field>
                    <Field
                        label="Default for Guests"
                        error={shown('guestDefaultExpiration')}
                    >
                        <Select
                            value={draft.guestDefaultExpiration}
                            onValueChange={(value) =>
                                setDraft({
                                    guestDefaultExpiration:
                                        value as ExpirationKey,
                                })
                            }
                        >
                            <SelectTrigger className="w-full sm:w-[12rem]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {EXPIRATION_ORDER.map((key) => (
                                    <SelectItem key={key} value={key}>
                                        {EXPIRATION_LABEL[key]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                </div>

                <div className="flex flex-col gap-5">
                    <Field
                        label="Choices Members get"
                        error={shown('memberExpirations')}
                    >
                        <ExpirationChoices
                            idPrefix="member"
                            value={draft.memberExpirations}
                            onChange={(next) =>
                                setDraft({ memberExpirations: next })
                            }
                        />
                    </Field>
                    <Field
                        label="Default for Members"
                        error={shown('memberDefaultExpiration')}
                    >
                        <Select
                            value={draft.memberDefaultExpiration}
                            onValueChange={(value) =>
                                setDraft({
                                    memberDefaultExpiration:
                                        value as ExpirationKey,
                                })
                            }
                        >
                            <SelectTrigger className="w-full sm:w-[12rem]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {EXPIRATION_ORDER.map((key) => (
                                    <SelectItem key={key} value={key}>
                                        {EXPIRATION_LABEL[key]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                </div>
            </div>

            <div className="border-border flex items-start gap-3 border-t pt-4">
                <Switch
                    id="guest-password"
                    checked={draft.guestPasswordProtection}
                    onCheckedChange={(checked) =>
                        setDraft({ guestPasswordProtection: checked })
                    }
                />
                <div>
                    <Label htmlFor="guest-password" className="text-[13px]">
                        Guests may password protect a share
                    </Label>
                    <p className="text-muted-foreground mt-1 text-[12px] leading-relaxed">
                        Members always can.
                    </p>
                </div>
            </div>
        </>
    );
}

export function LimitsSettings() {
    const { draft, setDraft, shown } = useAdminSettings();

    return (
        <>
            <PageHead
                title="Limits"
                description="Quotas apply to Members. Guest shares count against nothing because they belong to no account."
            />
            <div className="grid gap-5 sm:grid-cols-2">
                <Field
                    label="Default Member storage quota"
                    hint="0 means no limit. Applies to accounts created from here on."
                    error={shown('defaultQuotaMb')}
                >
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min={0}
                            value={draft.defaultQuotaMb}
                            aria-invalid={Boolean(shown('defaultQuotaMb'))}
                            onChange={(event) =>
                                setDraft({
                                    defaultQuotaMb: Number(event.target.value),
                                })
                            }
                            className="w-[9rem] font-mono"
                        />
                        <span className="text-muted-foreground font-mono text-[12px]">
                            MB
                        </span>
                    </div>
                </Field>

                <Field label="Maximum upload size" error={shown('maxUploadMb')}>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min={1}
                            value={draft.maxUploadMb}
                            aria-invalid={Boolean(shown('maxUploadMb'))}
                            onChange={(event) =>
                                setDraft({
                                    maxUploadMb: Number(event.target.value),
                                })
                            }
                            className="w-[9rem] font-mono"
                        />
                        <span className="text-muted-foreground font-mono text-[12px]">
                            MB per file
                        </span>
                    </div>
                </Field>
            </div>
            <p className="text-muted-foreground text-[12.5px] leading-relaxed">
                An individual quota is set on the person, under{' '}
                <Link
                    to="/admin/users"
                    className="underline underline-offset-4"
                >
                    Users
                </Link>
                .
            </p>
        </>
    );
}

export function FileTypesSettings() {
    const { draft, setDraft } = useAdminSettings();
    const [extension, setExtension] = useState('');

    return (
        <>
            <PageHead
                title="File types"
                description="Either name the extensions that are refused, or name the only ones accepted."
            />
            <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={draft.fileTypeMode}
                onValueChange={(value) =>
                    value &&
                    setDraft({
                        fileTypeMode: value as AdminConfig['fileTypeMode'],
                    })
                }
            >
                <ToggleGroupItem value="block">Block these</ToggleGroupItem>
                <ToggleGroupItem value="allow">
                    Allow only these
                </ToggleGroupItem>
            </ToggleGroup>

            <div className="flex flex-wrap gap-1.5">
                {draft.fileTypeList.length === 0 && (
                    <p className="text-muted-foreground text-[12.5px]">
                        {draft.fileTypeMode === 'block'
                            ? 'Nothing blocked. Every extension is accepted.'
                            : 'Nothing allowed yet, so every upload will be refused.'}
                    </p>
                )}
                {draft.fileTypeList.map((ext) => (
                    <span
                        key={ext}
                        className="border-border bg-sunken inline-flex items-center gap-1 rounded-sm border py-1 pl-2 pr-1 font-mono text-[11.5px]"
                    >
                        .{ext}
                        <button
                            type="button"
                            aria-label={`Remove .${ext}`}
                            className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-sm p-0.5 transition-colors"
                            onClick={() =>
                                setDraft({
                                    fileTypeList: draft.fileTypeList.filter(
                                        (e) => e !== ext,
                                    ),
                                })
                            }
                        >
                            <X className="size-3" />
                        </button>
                    </span>
                ))}
            </div>

            <form
                className="flex flex-wrap items-center gap-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    const clean = extension
                        .trim()
                        .replace(/^\./, '')
                        .toLowerCase();

                    if (!clean || draft.fileTypeList.includes(clean)) {
                        return;
                    }

                    setDraft({ fileTypeList: [...draft.fileTypeList, clean] });
                    setExtension('');
                }}
            >
                <Input
                    value={extension}
                    onChange={(event) => setExtension(event.target.value)}
                    placeholder="iso"
                    aria-label="Extension to add"
                    className="w-[9rem] font-mono"
                />
                <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={!extension.trim()}
                >
                    <Plus /> Add
                </Button>
            </form>
        </>
    );
}

export function TransferSettings() {
    const { draft, setDraft, shown } = useAdminSettings();
    const transfer = useDozo((s) => s.transfer);
    const windowMs = useDozo((s) => s.transferWindowMs());
    const live = transfer && !isTransferExpired(transfer, windowMs);

    return (
        <>
            <PageHead
                title="Transfer sessions"
                description="A Transfer Session is a scratch space between devices. It has no owner and no Library, so the only thing that ends it is time."
            />
            <Field
                label="Inactivity window"
                hint="A session ends this long after the last thing anyone does in it. Every item in it goes at the same moment."
                error={shown('transferWindowHours')}
            >
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        min={1}
                        max={168}
                        value={draft.transferWindowHours}
                        aria-invalid={Boolean(shown('transferWindowHours'))}
                        onChange={(event) =>
                            setDraft({
                                transferWindowHours: Number(event.target.value),
                            })
                        }
                        className="w-[9rem] font-mono"
                    />
                    <span className="text-muted-foreground font-mono text-[12px]">
                        hours
                    </span>
                </div>
            </Field>

            <p className="border-border text-muted-foreground border-t pt-4 font-mono text-[11.5px]">
                {live ? (
                    <>
                        One live session · {transfer.code} · clears in{' '}
                        <Countdown
                            target={transferExpiresAt(transfer, windowMs)}
                        />
                    </>
                ) : (
                    'No live session on this installation right now.'
                )}
            </p>
        </>
    );
}

export function HousekeepingSettings() {
    const shares = useDozo((s) => s.shares);
    const deleteShares = useDozo((s) => s.deleteShares);
    const { confirm, dialog } = useConfirm();
    const now = useNow(30_000);
    const guestShares = useMemo(
        () => shares.filter((s) => s.ownerId === null),
        [shares],
    );
    const expired = useMemo(
        () => shares.filter((s) => s.expiresAt !== null && s.expiresAt <= now),
        [now, shares],
    );

    const sweep = async (ids: string[], title: string, description: string) => {
        const ok = await confirm({
            title,
            description,
            confirmLabel: 'Delete them',
        });

        if (!ok) {
            return;
        }

        deleteShares(ids);
        toast(`Deleted ${ids.length} ${ids.length === 1 ? 'share' : 'shares'}`);
    };

    return (
        <>
            <PageHead
                title="Housekeeping"
                description="Two sweeps that nobody else on this installation can run: Guest shares belong to no account, and expired ones are already unreachable."
            />

            <div className="border-border bg-card flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3">
                <div className="mr-auto">
                    <p className="text-[13px] font-medium">
                        Delete every Guest share
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-[12px]">
                        {guestShares.length} on this installation right now.
                    </p>
                </div>
                <Button
                    variant="danger"
                    size="sm"
                    disabled={guestShares.length === 0}
                    onClick={() =>
                        void sweep(
                            guestShares.map((s) => s.id),
                            `Delete ${guestShares.length} Guest shares?`,
                            'Every link handed out by a signed-out visitor stops resolving right away. Nobody gets a warning first.',
                        )
                    }
                >
                    Delete
                </Button>
            </div>

            <div className="border-border bg-card flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3">
                <div className="mr-auto">
                    <p className="text-[13px] font-medium">
                        Purge expired shares
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-[12px]">
                        {expired.length} have run out their window and already
                        refuse to open.
                    </p>
                </div>
                <Button
                    variant="danger"
                    size="sm"
                    disabled={expired.length === 0}
                    onClick={() =>
                        void sweep(
                            expired.map((s) => s.id),
                            `Purge ${expired.length} expired shares?`,
                            'These already return the expired page. Removing them frees the storage back to whoever owned them.',
                        )
                    }
                >
                    Purge
                </Button>
            </div>
            {dialog}
        </>
    );
}
