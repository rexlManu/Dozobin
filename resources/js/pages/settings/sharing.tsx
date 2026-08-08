import { router, usePage } from '@inertiajs/react';
import { AppProviders } from '@/components/app-providers';
import { SettingsLayout, SettingsPageHead } from '@/components/settings-layout';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
        <>
            <SettingsPageHead
                title="Sharing defaults"
                description="Preselected on the Drop Workspace. The installation decides which windows exist at all."
            />
            <div className="flex flex-col gap-2 sm:max-w-[16rem]">
                <Label htmlFor="default-expiration">
                    Default Share Expiration
                </Label>
                <Select
                    value={account.defaultExpiration}
                    onValueChange={(value) =>
                        router.patch(
                            '/profile',
                            {
                                default_expiration: value as ExpirationKey,
                            },
                            { preserveScroll: true },
                        )
                    }
                >
                    <SelectTrigger id="default-expiration">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {EXPIRATION_ORDER.filter((key) =>
                            config.memberExpirations.includes(key),
                        ).map((key) => (
                            <SelectItem key={key} value={key}>
                                {EXPIRATION_LABEL[key]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </>
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
