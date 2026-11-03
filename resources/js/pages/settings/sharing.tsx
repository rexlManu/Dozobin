import { router, usePage } from '@inertiajs/react';
import { AppProviders } from '@/components/app-providers';
import { ChipGroup } from '@/components/chips';
import { SettingsCard, SettingsLayout } from '@/components/settings-layout';
import { EXPIRATION_LABEL, EXPIRATION_ORDER } from '@/lib/format';
import type { ExpirationKey } from '@/lib/types';
import type { SharedPageProps } from '@/types';

function SharingContent() {
    const { auth, config } = usePage<SharedPageProps>().props;
    const account = auth.user;

    if (!account) {
        return null;
    }

    return (
        <SettingsCard
            title="Sharing defaults"
            description="Picked for you on the Drop Workspace. The installation decides which choices exist."
        >
            <div className="grid gap-2.5">
                <p aria-hidden className="label-meta">
                    Default Share Expiration
                </p>
                <ChipGroup<ExpirationKey>
                    label="Default Share Expiration"
                    value={account.defaultExpiration}
                    options={EXPIRATION_ORDER.filter((key) =>
                        config.memberExpirations.includes(key),
                    ).map((key) => ({
                        value: key,
                        label: EXPIRATION_LABEL[key],
                    }))}
                    onChange={(value) =>
                        router.patch(
                            '/profile',
                            { default_expiration: value },
                            { preserveScroll: true },
                        )
                    }
                />
            </div>
        </SettingsCard>
    );
}

export default function SharingPage() {
    return (
        <AppProviders>
            <SettingsLayout>
                <SharingContent />
            </SettingsLayout>
        </AppProviders>
    );
}
