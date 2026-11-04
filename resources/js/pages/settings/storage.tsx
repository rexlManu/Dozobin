import { usePage } from '@inertiajs/react';
import { WarningCircle } from '@phosphor-icons/react';
import { AppProviders } from '@/components/app-providers';
import { SettingsCard, SettingsLayout } from '@/components/settings-layout';
import { formatBytes } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

function StorageContent() {
    const account = usePage<SharedPageProps>().props.auth.user;

    if (!account) {
        return null;
    }

    const ratio = account.storageUsed / account.storageLimit;
    const tight = ratio > 0.9;

    return (
        <SettingsCard
            title="Storage"
            description="The administrator sets your limit. You cannot raise it here."
        >
            <div className="grid gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p>
                        <span className="text-[28px] leading-none font-bold">
                            {formatBytes(account.storageUsed)}
                        </span>{' '}
                        <span className="text-muted-foreground">
                            of {formatBytes(account.storageLimit)}
                        </span>
                    </p>
                    <p
                        className={cn(
                            'font-bold',
                            tight ? 'text-destructive' : 'text-lamp',
                        )}
                    >
                        {Math.round(ratio * 1000) / 10}% used
                    </p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-sunken ring-[1.5px] ring-border ring-inset">
                    <div
                        className={cn(
                            'h-full rounded-full',
                            tight
                                ? 'bg-destructive'
                                : 'bg-linear-to-r from-lavender to-lamp',
                        )}
                        style={{
                            width: `${Math.min(100, Math.max(2, ratio * 100))}%`,
                        }}
                    />
                </div>
                {tight && (
                    <p className="flex items-start gap-2 text-[14px] font-bold text-destructive">
                        <WarningCircle
                            weight="fill"
                            className="mt-0.5 size-4 shrink-0"
                        />
                        Almost full. When it is full, uploads are refused until
                        you delete something or the administrator raises your
                        limit.
                    </p>
                )}
            </div>
        </SettingsCard>
    );
}

export default function StoragePage() {
    return (
        <AppProviders>
            <SettingsLayout>
                <StorageContent />
            </SettingsLayout>
        </AppProviders>
    );
}
