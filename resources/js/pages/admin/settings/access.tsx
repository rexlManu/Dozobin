import { AdminLayout } from '@/components/admin-layout';
import {
    AdminSettingsField,
    AdminSettingsLayout,
    AdminSettingsPageHead,
    useAdminSettings,
} from '@/components/admin-settings-layout';
import { AppProviders } from '@/components/app-providers';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import type { AdminConfig } from '@/lib/types';

function AccessContent() {
    const { draft, setDraft } = useAdminSettings();

    return (
        <>
            <AdminSettingsPageHead
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

            <AdminSettingsField label="Member registration">
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
            </AdminSettingsField>
        </>
    );
}

export default function AccessPage() {
    return (
        <AppProviders>
            <AdminLayout>
                <AdminSettingsLayout>
                    <AccessContent />
                </AdminSettingsLayout>
            </AdminLayout>
        </AppProviders>
    );
}
