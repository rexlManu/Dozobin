import { router, usePage } from '@inertiajs/react';
import { AppProviders } from '@/components/app-providers';
import { SettingsLayout, SettingsPageHead } from '@/components/settings-layout';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Appearance } from '@/lib/types';
import type { SharedPageProps } from '@/types';

function AppearanceContent() {
    const appearance = usePage<SharedPageProps>().props.appearance;

    return (
        <>
            <SettingsPageHead
                title="Appearance"
                description="System follows whatever the device is set to and changes with it."
            />
            <ToggleGroup
                type="single"
                variant="outline"
                value={appearance}
                onValueChange={(value) =>
                    value &&
                    router.patch(
                        '/profile',
                        { appearance: value as Appearance },
                        { preserveScroll: true },
                    )
                }
            >
                <ToggleGroupItem value="light">Light</ToggleGroupItem>
                <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
                <ToggleGroupItem value="system">System</ToggleGroupItem>
            </ToggleGroup>
        </>
    );
}

export default function AppearancePage() {
    return (
        <AppProviders>
            <SettingsLayout>
                <AppearanceContent />
            </SettingsLayout>
        </AppProviders>
    );
}
