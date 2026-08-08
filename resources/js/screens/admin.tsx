import { router, usePage } from '@inertiajs/react';
import { CheckCircle, Plus, WarningCircle, X } from '@phosphor-icons/react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
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
import { Link, NavLink } from '@/lib/navigation';
import { isTransferExpired, transferExpiresAt } from '@/lib/transfer-state';
import type {
    AdminConfig,
    ExpirationKey,
    Share,
    TransferSession,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

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
    payloadCleanupGraceHours: { to: 'housekeeping', label: 'Housekeeping' },
    malwareScanningEnabled: { to: 'housekeeping', label: 'Housekeeping' },
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

    if (
        !Number.isInteger(draft.payloadCleanupGraceHours) ||
        draft.payloadCleanupGraceHours < 0 ||
        draft.payloadCleanupGraceHours > 8760
    ) {
        errors.payloadCleanupGraceHours =
            'Give a whole number of hours between 0 and 8760.';
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
                <p className="-mt-1 text-[12px] leading-relaxed text-muted-foreground">
                    {hint}
                </p>
            )}
            {children}
            {error && (
                <p className="flex items-start gap-1.5 text-[12.5px] text-destructive">
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
            <p className="mt-1.5 max-w-[62ch] text-[13px] leading-relaxed text-muted-foreground">
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
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/uploads', label: 'Uploads' },
    // "Sessions" rather than "Transfer sessions", because Site settings already
    // has an item by that name and two identical labels in one sidebar is a
    // coin toss. The page's own heading says the full thing.
    { to: '/admin/sessions', label: 'Sessions' },
];

const SETTINGS_NAV = [
    { to: '/admin/settings/access', label: 'Access' },
    { to: '/admin/settings/expiration', label: 'Expiration' },
    { to: '/admin/settings/limits', label: 'Limits' },
    { to: '/admin/settings/file-types', label: 'File types' },
    { to: '/admin/settings/transfer', label: 'Transfer sessions' },
    { to: '/admin/settings/housekeeping', label: 'Housekeeping' },
];

function NavItem({ to, label }: { to: string; label: string }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    'relative shrink-0 px-2.5 py-2 text-[13px] transition-colors lg:py-1.5',
                    isActive
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                )
            }
        >
            {({ isActive }) => (
                <>
                    {isActive && (
                        <span
                            aria-hidden
                            className="absolute inset-x-2 -bottom-px h-[1.5px] bg-foreground lg:inset-x-auto lg:inset-y-1 lg:-left-px lg:h-auto lg:w-[1.5px]"
                        />
                    )}
                    {label}
                </>
            )}
        </NavLink>
    );
}

export function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <AppShell>
            <div className="rail py-6 sm:py-8">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h1 className="text-xl font-medium tracking-[-0.02em]">
                        Administration
                    </h1>
                    <p className="font-mono text-[11.5px] text-muted-foreground">
                        applies to everyone on this server
                    </p>
                </div>

                <div className="mt-6 grid gap-7 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
                    <nav className="-mx-4 flex scrollbar-slim gap-1 overflow-x-auto border-b border-border px-4 lg:sticky lg:top-20 lg:mx-0 lg:flex-col lg:gap-0.5 lg:self-start lg:overflow-visible lg:border-b-0 lg:border-l lg:px-0">
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
                        {children}
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

const AdminSettingsContext = createContext<SettingsContext | null>(null);

export function useAdminSettings() {
    const context = useContext(AdminSettingsContext);

    if (context === null) {
        throw new Error('Admin settings must be rendered inside its layout.');
    }

    return context;
}

/**
 * The draft spans six pages, so the save bar has to live above all of them.
 * When something is invalid it names the page that owns the field, because a
 * bare "fix 1 field" is useless when the field is two clicks away.
 */
export function AdminSettingsLayout({ children }: { children: ReactNode }) {
    const config = usePage<SharedPageProps>().props.config;
    const [draft, replaceDraft] = useState<AdminConfig>(() => ({ ...config }));
    const [serverErrors, setServerErrors] = useState<Errors>({});
    const setDraft = (patch: Partial<AdminConfig>) => {
        replaceDraft((current) => ({ ...current, ...patch }));
        setServerErrors(
            (current) =>
                Object.fromEntries(
                    Object.entries(current).filter(([key]) => !(key in patch)),
                ) as Errors,
        );
    };

    const [saved, setSaved] = useState(false);
    const [showErrors, setShowErrors] = useState(false);

    const clientErrors = useMemo(() => validate(draft), [draft]);
    const errors = useMemo(
        () => ({ ...clientErrors, ...serverErrors }),
        [clientErrors, serverErrors],
    );
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
            <AdminSettingsContext.Provider
                value={{ draft, setDraft, shown } satisfies SettingsContext}
            >
                {children}
            </AdminSettingsContext.Provider>

            <div className="sticky bottom-0 -mx-4 mt-2 border-t border-border bg-background/85 px-4 py-3 backdrop-blur-md sm:-mx-0 sm:px-0">
                <div className="flex flex-wrap items-center gap-3">
                    <p className="text-[12.5px] text-muted-foreground">
                        {saved ? (
                            <span className="flex items-center gap-1.5 text-foreground">
                                <CheckCircle
                                    weight="fill"
                                    className="size-3.5 text-primary"
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
                            onClick={() => {
                                replaceDraft({ ...config });
                                setServerErrors({});
                            }}
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

                                router.patch(
                                    '/admin/settings',
                                    { ...draft },
                                    {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            setShowErrors(false);
                                            setServerErrors({});
                                            setSaved(true);
                                        },
                                        onError: (responseErrors) => {
                                            setServerErrors(
                                                responseErrors as Errors,
                                            );
                                            setShowErrors(true);
                                        },
                                    },
                                );
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
                    <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
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
                                <span className="block text-[12px] text-muted-foreground">
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

            <div className="flex items-start gap-3 border-t border-border pt-4">
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
                    <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
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
                        <span className="font-mono text-[12px] text-muted-foreground">
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
                        <span className="font-mono text-[12px] text-muted-foreground">
                            MB per file
                        </span>
                    </div>
                </Field>
            </div>
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
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
                    <p className="text-[12.5px] text-muted-foreground">
                        {draft.fileTypeMode === 'block'
                            ? 'Nothing blocked. Every extension is accepted.'
                            : 'Nothing allowed yet, so every upload will be refused.'}
                    </p>
                )}
                {draft.fileTypeList.map((ext) => (
                    <span
                        key={ext}
                        className="inline-flex items-center gap-1 rounded-sm border border-border bg-sunken py-1 pr-1 pl-2 font-mono text-[11.5px]"
                    >
                        .{ext}
                        <button
                            type="button"
                            aria-label={`Remove .${ext}`}
                            className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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

export function TransferSettings({
    transfer,
}: {
    transfer: TransferSession | null;
}) {
    const { draft, setDraft, shown } = useAdminSettings();
    const windowMs = draft.transferWindowHours * 60 * 60 * 1000;
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
                    <span className="font-mono text-[12px] text-muted-foreground">
                        hours
                    </span>
                </div>
            </Field>

            <p className="border-t border-border pt-4 font-mono text-[11.5px] text-muted-foreground">
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

export function HousekeepingSettings({ shares }: { shares: Share[] }) {
    const { draft, setDraft, shown } = useAdminSettings();
    const { confirm, dialog } = useConfirm();
    const now = useNow(30_000);
    const guestShares = useMemo(
        () => shares.filter((s) => s.ownerId === null),
        [shares],
    );
    const cleanupCutoff = now - draft.payloadCleanupGraceHours * 60 * 60 * 1000;
    const expiredWithPayload = useMemo(
        () =>
            shares.filter(
                (share) =>
                    share.expiresAt !== null &&
                    share.expiresAt <= cleanupCutoff &&
                    !share.payloadDeletedAt &&
                    share.hasPayload !== false,
            ),
        [cleanupCutoff, shares],
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

        router.delete('/shares', {
            data: { ids },
            preserveScroll: true,
            onSuccess: () =>
                toast(
                    `Deleted ${ids.length} ${ids.length === 1 ? 'share' : 'shares'}`,
                ),
        });
    };

    const cleanExpiredPayloads = async () => {
        const ok = await confirm({
            title: `Clean ${expiredWithPayload.length} expired payloads?`,
            description:
                'The Share records and URLs stay in place. Only their stored files or paste bodies are removed.',
            confirmLabel: 'Queue cleanup',
        });

        if (!ok) {
            return;
        }

        router.post(
            '/admin/housekeeping/expired-share-payloads',
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast('Expired payload cleanup queued'),
            },
        );
    };

    return (
        <>
            <PageHead
                title="Housekeeping"
                description="Control how expired payloads leave storage and whether File Shares are checked by ClamAV. Share records remain after automatic cleanup."
            />

            <div className="grid gap-5 sm:grid-cols-2">
                <Field
                    label="Expired payload grace period"
                    hint="0 means the next hourly cleanup run."
                    error={shown('payloadCleanupGraceHours')}
                >
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min={0}
                            max={8760}
                            value={draft.payloadCleanupGraceHours}
                            aria-invalid={Boolean(
                                shown('payloadCleanupGraceHours'),
                            )}
                            onChange={(event) =>
                                setDraft({
                                    payloadCleanupGraceHours: Number(
                                        event.target.value,
                                    ),
                                })
                            }
                            className="w-[9rem] font-mono"
                        />
                        <span className="font-mono text-[12px] text-muted-foreground">
                            hours
                        </span>
                    </div>
                </Field>

                <div className="flex items-start gap-3">
                    <Switch
                        id="malware-scanning"
                        checked={draft.malwareScanningEnabled}
                        aria-invalid={Boolean(shown('malwareScanningEnabled'))}
                        onCheckedChange={(checked) =>
                            setDraft({ malwareScanningEnabled: checked })
                        }
                    />
                    <div>
                        <Label
                            htmlFor="malware-scanning"
                            className="text-[13px]"
                        >
                            Scan new File Shares for malware
                        </Label>
                        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                            Requires a reachable clamd service. Files stay
                            downloadable while scans are pending or fail.
                        </p>
                        {shown('malwareScanningEnabled') && (
                            <p className="mt-1 text-[12px] text-destructive">
                                {shown('malwareScanningEnabled')}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                <div className="mr-auto">
                    <p className="text-[13px] font-medium">
                        Delete every Guest share
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
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

            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                <div className="mr-auto">
                    <p className="text-[13px] font-medium">
                        Clean expired payloads now
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {expiredWithPayload.length} are past expiry and the
                        configured grace period.
                    </p>
                </div>
                <Button
                    variant="danger"
                    size="sm"
                    disabled={expiredWithPayload.length === 0}
                    onClick={() => void cleanExpiredPayloads()}
                >
                    Queue cleanup
                </Button>
            </div>
            {dialog}
        </>
    );
}
