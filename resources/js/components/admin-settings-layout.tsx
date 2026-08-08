import { router, usePage } from '@inertiajs/react';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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

export function AdminSettingsPageHead({
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
