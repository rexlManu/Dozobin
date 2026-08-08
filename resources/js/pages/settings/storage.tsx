import { usePage } from '@inertiajs/react';
import { WarningCircle } from '@phosphor-icons/react';
import { AppProviders } from '@/components/app-providers';
import { SettingsLayout, SettingsPageHead } from '@/components/settings-layout';
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
        <>
            <SettingsPageHead
                title="Storage"
                description="The limit is assigned by whoever runs this installation. You cannot raise it from here."
            />
            <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-mono text-[13px]">
                        {formatBytes(account.storageUsed)}{' '}
                        <span className="text-muted-foreground">
                            of {formatBytes(account.storageLimit)}
                        </span>
                    </p>
                    <p
                        className={cn(
                            'font-mono text-[12px]',
                            tight
                                ? 'text-destructive'
                                : 'text-muted-foreground',
                        )}
                    >
                        {Math.round(ratio * 1000) / 10}% used
                    </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                        className={cn(
                            'h-full rounded-full',
                            tight ? 'bg-destructive' : 'bg-primary',
                        )}
                        style={{
                            width: `${Math.min(100, Math.max(2, ratio * 100))}%`,
                        }}
                    />
                </div>
                {tight && (
                    <p className="mt-3 flex items-start gap-1.5 text-[12.5px] text-destructive">
                        <WarningCircle
                            weight="fill"
                            className="mt-px size-3.5 shrink-0"
                        />
                        Uploads will be refused until something is deleted or
                        the administrator raises the quota.
                    </p>
                )}
            </div>
        </>
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
