import { usePage } from '@inertiajs/react';
import { AdminCard, AdminLayout } from '@/components/admin-layout';
import {
    AdminSettingsField,
    AdminSettingsLayout,
    AdminSettingsSwitch,
    useAdminSettings,
} from '@/components/admin-settings-layout';
import { AppProviders } from '@/components/app-providers';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Link } from '@/lib/navigation';
import type { AdminConfig } from '@/lib/types';
import type { SharedPageProps } from '@/types';

function AccessContent() {
    const { draft, setDraft } = useAdminSettings();
    const persistedRegistration =
        usePage<SharedPageProps>().props.config.registration;

    return (
        <>
            <AdminCard className="grid gap-7">
                <AdminSettingsSwitch
                    id="guest-sharing"
                    label="Guests may create shares"
                    hint="When off, the Drop Workspace asks Guests to sign in. Transfer Sessions keep working."
                    checked={draft.guestSharing}
                    onCheckedChange={(checked) =>
                        setDraft({ guestSharing: checked })
                    }
                />

                <AdminSettingsField label="Member registration">
                    <RadioGroup
                        value={draft.registration}
                        onValueChange={(value) =>
                            setDraft({
                                registration:
                                    value as AdminConfig['registration'],
                            })
                        }
                        className="grid gap-2 sm:grid-cols-3"
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
                                    'Needs a code you hand out.',
                                ],
                                ['closed', 'Closed', 'No new accounts.'],
                            ] as const
                        ).map(([value, label, hint]) => (
                            <label
                                key={value}
                                htmlFor={`reg-${value}`}
                                className="flex cursor-pointer gap-3 rounded-[18px] border-[1.5px] border-border bg-sunken px-4 py-3 transition-colors hover:border-border-strong has-data-[state=checked]:border-lavender"
                            >
                                <RadioGroupItem
                                    id={`reg-${value}`}
                                    value={value}
                                    className="mt-0.5"
                                />
                                <span>
                                    <span className="block font-bold">
                                        {label}
                                    </span>
                                    <span className="block text-[13px] text-muted-foreground">
                                        {hint}
                                    </span>
                                </span>
                            </label>
                        ))}
                    </RadioGroup>
                    {draft.registration === 'invite' && (
                        <p className="text-[14px] text-muted-foreground">
                            {persistedRegistration === 'invite' ? (
                                <>
                                    Create and revoke codes under{' '}
                                    <Link
                                        to="/admin/invites"
                                        className="font-bold text-lavender underline underline-offset-4"
                                    >
                                        Invites
                                    </Link>
                                    .
                                </>
                            ) : (
                                'Save this change before creating invite codes.'
                            )}
                        </p>
                    )}
                </AdminSettingsField>
            </AdminCard>
        </>
    );
}

export default function AccessPage() {
    return (
        <AppProviders>
            <AdminLayout>
                <AdminSettingsLayout section="access">
                    <AccessContent />
                </AdminSettingsLayout>
            </AdminLayout>
        </AppProviders>
    );
}
