import { router, usePage } from '@inertiajs/react';
import {
    ArrowsLeftRight,
    Broom,
    CaretUpDown,
    CheckCircle,
    FileX,
    Gauge,
    Hourglass,
    Info,
    UsersThree,
    WarningCircle,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { EXPIRATION_LABEL, formatBytes } from '@/lib/format';
import { Link, useNavigate } from '@/lib/navigation';
import type { AdminConfig } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

type Errors = Partial<Record<keyof AdminConfig, string>>;

export type SettingsSectionKey =
    | 'access'
    | 'expiration'
    | 'limits'
    | 'file-types'
    | 'transfer'
    | 'housekeeping'
    | 'system';

interface SettingsSection {
    key: SettingsSectionKey;
    label: string;
    group: 'Sharing' | 'Transfer Sessions' | 'Upkeep';
    icon: Icon;
    description: string;
    /** The draft fields this page edits, for its unsaved and error marks. */
    fields: (keyof AdminConfig)[];
    /** One short line with the current value, shown in the menu. */
    summary: (config: AdminConfig) => string;
}

const REGISTRATION_LABEL: Record<AdminConfig['registration'], string> = {
    open: 'open sign-up',
    invite: 'invite only',
    closed: 'no sign-up',
};

const hours = (value: number) => `${value} ${value === 1 ? 'hour' : 'hours'}`;

/** Every admin settings page, in menu order. */
export const SETTINGS_SECTIONS: SettingsSection[] = [
    {
        key: 'access',
        label: 'Access',
        group: 'Sharing',
        icon: UsersThree,
        description: 'Who can put something on this installation.',
        fields: ['guestSharing', 'registration'],
        summary: (c) =>
            `${c.guestSharing ? 'Guests share' : 'Members only'}, ${REGISTRATION_LABEL[c.registration]}`,
    },
    {
        key: 'expiration',
        label: 'Expiration',
        group: 'Sharing',
        icon: Hourglass,
        description:
            'The windows the Drop Workspace offers. Guests and Members can get different ones.',
        fields: [
            'guestExpirations',
            'guestDefaultExpiration',
            'memberExpirations',
            'memberDefaultExpiration',
            'guestPasswordProtection',
        ],
        summary: (c) =>
            `Guests ${EXPIRATION_LABEL[c.guestDefaultExpiration]}, Members ${EXPIRATION_LABEL[c.memberDefaultExpiration]}`,
    },
    {
        key: 'limits',
        label: 'Limits',
        group: 'Sharing',
        icon: Gauge,
        description:
            'Quotas apply to Members. Guest shares belong to no account, so they count against nothing.',
        fields: ['defaultQuotaMb', 'maxUploadMb'],
        summary: (c) =>
            `${c.defaultQuotaMb === 0 ? 'No quota' : `${formatBytes(c.defaultQuotaMb * 1024 * 1024)} each`}, ${formatBytes(c.maxUploadMb * 1024 * 1024)} per file`,
    },
    {
        key: 'file-types',
        label: 'File types',
        group: 'Sharing',
        icon: FileX,
        description: 'Block some extensions, or accept only the ones you name.',
        fields: ['fileTypeMode', 'fileTypeList'],
        summary: (c) =>
            c.fileTypeList.length === 0
                ? c.fileTypeMode === 'block'
                    ? 'Everything allowed'
                    : 'Nothing allowed'
                : `${c.fileTypeMode === 'block' ? 'Blocks' : 'Allows only'} ${c.fileTypeList.length} ${c.fileTypeList.length === 1 ? 'type' : 'types'}`,
    },
    {
        key: 'transfer',
        label: 'Transfer Sessions',
        group: 'Transfer Sessions',
        icon: ArrowsLeftRight,
        description:
            'A Transfer Session has no owner and no Library, so only time ends it.',
        fields: ['transferWindowHours'],
        summary: (c) => `Ends after ${hours(c.transferWindowHours)} idle`,
    },
    {
        key: 'housekeeping',
        label: 'Housekeeping',
        group: 'Upkeep',
        icon: Broom,
        description:
            'How expired payloads leave storage, and whether ClamAV checks File Shares. Share records stay after cleanup.',
        fields: ['payloadCleanupGraceHours', 'malwareScanningEnabled'],
        summary: (c) =>
            `Cleanup after ${hours(c.payloadCleanupGraceHours)}, scans ${c.malwareScanningEnabled ? 'on' : 'off'}`,
    },
    {
        key: 'system',
        label: 'System',
        group: 'Upkeep',
        icon: Info,
        description: 'Release status and the tracking code.',
        fields: [],
        summary: () => 'Release and tracking code',
    },
];

const GROUPS = ['Sharing', 'Transfer Sessions', 'Upkeep'] as const;

/** Which settings page owns each field, so the save bar can name the one to fix. */
const FIELD_SECTION = Object.fromEntries(
    SETTINGS_SECTIONS.flatMap((section) =>
        section.fields.map((field) => [field, section]),
    ),
) as Partial<Record<keyof AdminConfig, SettingsSection>>;

/*
  The draft lives outside the pages, so unsaved edits survive moving from one
  settings page to the next. It is only reused while the saved config it
  started from is still the current one.
*/
let pending: { base: string; draft: AdminConfig } | null = null;

function storedDraft(config: AdminConfig): AdminConfig {
    return pending !== null && pending.base === JSON.stringify(config)
        ? pending.draft
        : { ...config };
}

function changedFields(draft: AdminConfig, config: AdminConfig) {
    return (Object.keys(config) as (keyof AdminConfig)[]).filter(
        (key) => JSON.stringify(draft[key]) !== JSON.stringify(config[key]),
    );
}

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

/** A labelled form field: 13px bold label, optional hint, then the control and its error. */
export function AdminSettingsField({
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
            <Label className="label-meta">{label}</Label>
            {children}
            {hint && (
                <p className="text-[13px] text-muted-foreground">{hint}</p>
            )}
            {error && (
                <p className="flex items-start gap-1.5 text-[13px] font-bold text-destructive">
                    <WarningCircle
                        weight="fill"
                        className="mt-0.5 size-4 shrink-0"
                    />
                    {error}
                </p>
            )}
        </div>
    );
}

/** A switch with a bold label and one muted line under it. */
export function AdminSettingsSwitch({
    id,
    label,
    hint,
    error,
    checked,
    onCheckedChange,
}: {
    id: string;
    label: string;
    hint?: React.ReactNode;
    error?: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-start gap-3">
            <Switch
                id={id}
                checked={checked}
                aria-invalid={Boolean(error)}
                onCheckedChange={onCheckedChange}
                className="mt-0.5"
            />
            <div className="min-w-0">
                <Label htmlFor={id} className="text-[15px] font-bold">
                    {label}
                </Label>
                {hint && (
                    <p className="mt-0.5 text-[14px] text-muted-foreground">
                        {hint}
                    </p>
                )}
                {error && (
                    <p className="mt-1 text-[13px] font-bold text-destructive">
                        {error}
                    </p>
                )}
            </div>
        </div>
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

type SectionMark = 'changed' | 'invalid' | undefined;

function MenuItem({
    section,
    config,
    active,
    mark,
}: {
    section: SettingsSection;
    config: AdminConfig;
    active: boolean;
    mark: SectionMark;
}) {
    const Glyph = section.icon;

    return (
        <Link
            to={`/admin/settings/${section.key}`}
            aria-current={active ? 'page' : undefined}
            className={cn(
                'group flex items-center gap-3 rounded-[16px] px-2.5 py-2 transition-colors',
                active ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]',
            )}
        >
            <span
                className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-[12px] transition-colors',
                    active
                        ? 'bg-lavender text-night'
                        : 'bg-sunken text-muted-foreground group-hover:text-foreground',
                )}
            >
                <Glyph
                    weight={active ? 'fill' : 'regular'}
                    className="size-[18px]"
                />
            </span>
            <span className="grid min-w-0 flex-1">
                <span
                    className={cn(
                        'text-[15px] font-bold',
                        active ? 'text-foreground' : 'text-foreground/85',
                    )}
                >
                    {section.label}
                </span>
                <span className="truncate text-[13px] text-muted-foreground">
                    {section.summary(config)}
                </span>
            </span>
            {mark && (
                <span
                    title={
                        mark === 'invalid' ? 'Needs a fix' : 'Unsaved changes'
                    }
                    className={cn(
                        'size-2 shrink-0 rounded-full',
                        mark === 'invalid' ? 'bg-destructive' : 'bg-lamp',
                    )}
                >
                    <span className="sr-only">
                        {mark === 'invalid' ? 'Needs a fix' : 'Unsaved changes'}
                    </span>
                </span>
            )}
        </Link>
    );
}

/**
 * The frame of every admin settings page: a grouped menu with a live summary
 * of each page on the left (a section picker on a phone), and the page with
 * its heading on the right. `draft` and `marks` come from the settings
 * layout; System has no draft and shows the saved values.
 */
export function AdminSettingsFrame({
    current,
    draft,
    marks = {},
    children,
}: {
    current: SettingsSectionKey;
    draft?: AdminConfig;
    marks?: Partial<Record<SettingsSectionKey, SectionMark>>;
    children: ReactNode;
}) {
    const saved = usePage<SharedPageProps>().props.config;
    const config = draft ?? storedDraft(saved);
    const navigate = useNavigate();
    const section =
        SETTINGS_SECTIONS.find((item) => item.key === current) ??
        SETTINGS_SECTIONS[0];
    const Glyph = section.icon;

    return (
        <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start lg:gap-6">
            <nav
                aria-label="Settings"
                className="hidden rounded-[24px] border-[1.5px] border-border bg-card p-2 lg:sticky lg:top-20 lg:grid lg:gap-1"
            >
                {GROUPS.map((group) => (
                    <div key={group} className="grid gap-0.5">
                        <p className="label-meta px-3 pt-2.5 pb-1">{group}</p>
                        {SETTINGS_SECTIONS.filter(
                            (item) => item.group === group,
                        ).map((item) => (
                            <MenuItem
                                key={item.key}
                                section={item}
                                config={config}
                                active={item.key === current}
                                mark={marks[item.key]}
                            />
                        ))}
                    </div>
                ))}
            </nav>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-[20px] border-[1.5px] border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-border-strong aria-expanded:border-lavender lg:hidden"
                    >
                        <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-lavender text-night">
                            <Glyph weight="fill" className="size-[18px]" />
                        </span>
                        <span className="grid min-w-0 flex-1">
                            <span className="text-[15px] font-bold">
                                {section.label}
                            </span>
                            <span className="truncate text-[13px] text-muted-foreground">
                                {section.summary(config)}
                            </span>
                        </span>
                        <span className="text-[13px] font-bold text-muted-foreground">
                            All settings
                        </span>
                        <CaretUpDown className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="lg:hidden">
                    {GROUPS.map((group) => (
                        <div key={group}>
                            <DropdownMenuLabel className="label-meta px-3 pt-2 pb-1">
                                {group}
                            </DropdownMenuLabel>
                            {SETTINGS_SECTIONS.filter(
                                (item) => item.group === group,
                            ).map((item) => {
                                const ItemGlyph = item.icon;

                                return (
                                    <DropdownMenuItem
                                        key={item.key}
                                        onSelect={() =>
                                            navigate(
                                                `/admin/settings/${item.key}`,
                                            )
                                        }
                                        className={cn(
                                            item.key === current &&
                                                'bg-white/[0.05]',
                                        )}
                                    >
                                        <ItemGlyph />
                                        <span className="grid min-w-0 flex-1">
                                            <span>{item.label}</span>
                                            <span className="truncate text-[13px] font-medium text-muted-foreground">
                                                {item.summary(config)}
                                            </span>
                                        </span>
                                        {marks[item.key] && (
                                            <span
                                                className={cn(
                                                    'size-2 rounded-full',
                                                    marks[item.key] ===
                                                        'invalid'
                                                        ? 'bg-destructive'
                                                        : 'bg-lamp',
                                                )}
                                            />
                                        )}
                                    </DropdownMenuItem>
                                );
                            })}
                        </div>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex min-w-0 flex-col gap-5">
                <header className="flex items-start gap-3.5">
                    <span className="hidden size-11 shrink-0 place-items-center rounded-[14px] bg-lavender-soft text-lavender lg:grid">
                        <Glyph weight="fill" className="size-[22px]" />
                    </span>
                    <div className="min-w-0">
                        <h2 className="text-[22px] leading-tight font-bold max-lg:sr-only">
                            {section.label}
                        </h2>
                        <p className="max-w-[62ch] text-muted-foreground lg:mt-1">
                            {section.description}
                        </p>
                    </div>
                </header>
                {children}
            </div>
        </div>
    );
}

/**
 * The draft spans six pages, so the save bar has to live above all of them.
 * It shows only when there is something to save. When something is invalid
 * it names the page that owns the field, because a bare "fix 1 field" is
 * useless when the field is two clicks away.
 */
export function AdminSettingsLayout({
    section: current,
    children,
}: {
    section: SettingsSectionKey;
    children: ReactNode;
}) {
    const config = usePage<SharedPageProps>().props.config;
    const [draft, replaceDraft] = useState<AdminConfig>(() =>
        storedDraft(config),
    );
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
    const changed = changedFields(draft, config);
    const dirty = changed.length > 0;
    const invalid = Object.keys(errors).length > 0;

    useEffect(() => {
        pending = dirty ? { base: JSON.stringify(config), draft } : null;
    }, [dirty, draft, config]);

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

    const marks: Partial<Record<SettingsSectionKey, SectionMark>> = {};

    for (const field of changed) {
        const owner = FIELD_SECTION[field];

        if (owner) {
            marks[owner.key] = 'changed';
        }
    }

    if (showErrors) {
        for (const field of Object.keys(errors) as (keyof AdminConfig)[]) {
            const owner = FIELD_SECTION[field];

            if (owner) {
                marks[owner.key] = 'invalid';
            }
        }
    }

    return (
        <AdminSettingsFrame current={current} draft={draft} marks={marks}>
            <AdminSettingsContext.Provider
                value={{ draft, setDraft, shown } satisfies SettingsContext}
            >
                {children}
            </AdminSettingsContext.Provider>

            {(dirty || saved) && (
                // Sits above the phone's bottom nav, which is fixed and about 64px tall.
                <div
                    role="status"
                    className={cn(
                        'dz-pop sticky bottom-[84px] z-20 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[20px] border-[1.5px] bg-popover py-2.5 pr-2.5 pl-4 shadow-[0_18px_44px_-18px_rgb(0_0_0/0.8)] md:bottom-5',
                        saved && !dirty ? 'border-mint/40' : 'border-lamp/40',
                    )}
                >
                    <p className="text-[14px]">
                        {saved && !dirty ? (
                            <span className="flex items-center gap-1.5 font-bold text-mint">
                                <CheckCircle weight="fill" className="size-4" />
                                Saved. It applies right away.
                            </span>
                        ) : showErrors && invalid && badSection ? (
                            <span className="font-bold text-destructive">
                                Fix {Object.keys(errors).length} field
                                {Object.keys(errors).length === 1
                                    ? ''
                                    : 's'} in{' '}
                                <Link
                                    to={`/admin/settings/${badSection.key}`}
                                    className="underline underline-offset-4"
                                >
                                    {badSection.label}
                                </Link>
                            </span>
                        ) : (
                            <span className="font-bold text-lamp">
                                {changed.length} unsaved{' '}
                                {changed.length === 1 ? 'change' : 'changes'}
                            </span>
                        )}
                    </p>
                    {dirty && (
                        <div className="ml-auto flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    replaceDraft({ ...config });
                                    setServerErrors({});
                                    setShowErrors(false);
                                }}
                            >
                                Discard
                            </Button>
                            <Button
                                size="sm"
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
                                                pending = null;
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
                    )}
                </div>
            )}
        </AdminSettingsFrame>
    );
}
