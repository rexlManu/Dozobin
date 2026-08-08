import { AdminLayout } from '@/components/admin-layout';
import {
    AdminSettingsField,
    AdminSettingsLayout,
    AdminSettingsPageHead,
    useAdminSettings,
} from '@/components/admin-settings-layout';
import { AppProviders } from '@/components/app-providers';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { EXPIRATION_LABEL, EXPIRATION_ORDER } from '@/lib/format';
import type { ExpirationKey } from '@/lib/types';

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

function ExpirationContent() {
    const { draft, setDraft, shown } = useAdminSettings();

    return (
        <>
            <AdminSettingsPageHead
                title="Expiration"
                description="Guests and Members can be offered different windows. Whatever you pick here is what the Drop Workspace shows."
            />
            <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-5">
                    <AdminSettingsField
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
                    </AdminSettingsField>
                    <AdminSettingsField
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
                    </AdminSettingsField>
                </div>

                <div className="flex flex-col gap-5">
                    <AdminSettingsField
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
                    </AdminSettingsField>
                    <AdminSettingsField
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
                    </AdminSettingsField>
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

export default function ExpirationPage() {
    return (
        <AppProviders>
            <AdminLayout>
                <AdminSettingsLayout>
                    <ExpirationContent />
                </AdminSettingsLayout>
            </AdminLayout>
        </AppProviders>
    );
}
