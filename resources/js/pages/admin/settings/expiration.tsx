import { AdminCard, AdminLayout } from '@/components/admin-layout';
import {
    AdminSettingsField,
    AdminSettingsLayout,
    AdminSettingsSwitch,
    useAdminSettings,
} from '@/components/admin-settings-layout';
import { AppProviders } from '@/components/app-providers';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { EXPIRATION_LABEL, EXPIRATION_ORDER } from '@/lib/format';
import type { ExpirationKey } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Several windows can be on at once, so each chip toggles on its own. Pressed chips are lamplight. */
function ExpirationChoices({
    value,
    onChange,
    label,
}: {
    value: ExpirationKey[];
    onChange: (next: ExpirationKey[]) => void;
    label: string;
}) {
    return (
        <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
            {EXPIRATION_ORDER.map((key) => {
                const on = value.includes(key);

                return (
                    <button
                        key={key}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                            onChange(
                                on
                                    ? value.filter((k) => k !== key)
                                    : EXPIRATION_ORDER.filter(
                                          (k) => k === key || value.includes(k),
                                      ),
                            )
                        }
                        className={cn(
                            'rounded-[13px] border-[1.5px] px-3 py-1.5 text-[14px] font-bold transition-[transform,color,border-color] duration-200 ease-bounce',
                            on
                                ? '-translate-y-px border-lamp bg-lamp text-warn-foreground'
                                : 'border-border text-muted-foreground hover:border-border-strong hover:text-foreground',
                        )}
                    >
                        {EXPIRATION_LABEL[key]}
                    </button>
                );
            })}
        </div>
    );
}

function DefaultSelect({
    value,
    onChange,
}: {
    value: ExpirationKey;
    onChange: (next: ExpirationKey) => void;
}) {
    return (
        <Select
            value={value}
            onValueChange={(next) => onChange(next as ExpirationKey)}
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
    );
}

function ExpirationContent() {
    const { draft, setDraft, shown } = useAdminSettings();

    return (
        <>
            <div className="grid gap-5 xl:grid-cols-2">
                <AdminCard className="grid content-start gap-5">
                    <h3 className="text-[17px] font-bold">Guests</h3>
                    <AdminSettingsField
                        label="Choices"
                        error={shown('guestExpirations')}
                    >
                        <ExpirationChoices
                            label="Choices Guests get"
                            value={draft.guestExpirations}
                            onChange={(next) =>
                                setDraft({ guestExpirations: next })
                            }
                        />
                    </AdminSettingsField>
                    <AdminSettingsField
                        label="Default"
                        error={shown('guestDefaultExpiration')}
                    >
                        <DefaultSelect
                            value={draft.guestDefaultExpiration}
                            onChange={(next) =>
                                setDraft({ guestDefaultExpiration: next })
                            }
                        />
                    </AdminSettingsField>
                    <AdminSettingsSwitch
                        id="guest-password"
                        label="Guests may set a password"
                        hint="Members always can."
                        checked={draft.guestPasswordProtection}
                        onCheckedChange={(checked) =>
                            setDraft({ guestPasswordProtection: checked })
                        }
                    />
                </AdminCard>

                <AdminCard className="grid content-start gap-5">
                    <h3 className="text-[17px] font-bold">Members</h3>
                    <AdminSettingsField
                        label="Choices"
                        error={shown('memberExpirations')}
                    >
                        <ExpirationChoices
                            label="Choices Members get"
                            value={draft.memberExpirations}
                            onChange={(next) =>
                                setDraft({ memberExpirations: next })
                            }
                        />
                    </AdminSettingsField>
                    <AdminSettingsField
                        label="Default"
                        error={shown('memberDefaultExpiration')}
                    >
                        <DefaultSelect
                            value={draft.memberDefaultExpiration}
                            onChange={(next) =>
                                setDraft({ memberDefaultExpiration: next })
                            }
                        />
                    </AdminSettingsField>
                </AdminCard>
            </div>
        </>
    );
}

export default function ExpirationPage() {
    return (
        <AppProviders>
            <AdminLayout>
                <AdminSettingsLayout section="expiration">
                    <ExpirationContent />
                </AdminSettingsLayout>
            </AdminLayout>
        </AppProviders>
    );
}
