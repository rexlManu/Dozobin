import { router, usePage } from '@inertiajs/react';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AdminPageHead } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Link } from '@/lib/navigation';
import type { AdminConfig } from '@/lib/types';
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

/** Settings pages share the admin page heading. */
export const AdminSettingsPageHead = AdminPageHead;

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

            {/* Sits above the phone's bottom nav, which is fixed and about 64px tall. */}
            <div className="sticky bottom-[76px] z-20 mt-1 rounded-[20px] border-[1.5px] border-border bg-card py-2.5 pr-2.5 pl-4 md:bottom-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <p className="text-[14px] text-muted-foreground">
                        {saved ? (
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
                                    to={`/admin/settings/${badSection.to}`}
                                    className="underline underline-offset-4"
                                >
                                    {badSection.label}
                                </Link>
                            </span>
                        ) : dirty ? (
                            <span className="font-bold text-lamp">
                                Unsaved changes
                            </span>
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
