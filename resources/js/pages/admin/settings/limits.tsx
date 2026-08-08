import { AdminLayout } from '@/components/admin-layout';
import {
    AdminSettingsField,
    AdminSettingsLayout,
    AdminSettingsPageHead,
    useAdminSettings,
} from '@/components/admin-settings-layout';
import { AppProviders } from '@/components/app-providers';
import { Input } from '@/components/ui/input';
import { Link } from '@/lib/navigation';

function LimitsContent() {
    const { draft, setDraft, shown } = useAdminSettings();

    return (
        <>
            <AdminSettingsPageHead
                title="Limits"
                description="Quotas apply to Members. Guest shares count against nothing because they belong to no account."
            />
            <div className="grid gap-5 sm:grid-cols-2">
                <AdminSettingsField
                    label="Default Member storage quota"
                    hint="0 means no limit. Applies to accounts created from here on."
                    error={shown('defaultQuotaMb')}
                >
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min={0}
                            value={draft.defaultQuotaMb}
                            aria-invalid={Boolean(shown('defaultQuotaMb'))}
                            onChange={(event) =>
                                setDraft({
                                    defaultQuotaMb: Number(event.target.value),
                                })
                            }
                            className="w-[9rem] font-mono"
                        />
                        <span className="font-mono text-[12px] text-muted-foreground">
                            MB
                        </span>
                    </div>
                </AdminSettingsField>

                <AdminSettingsField
                    label="Maximum upload size"
                    error={shown('maxUploadMb')}
                >
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min={1}
                            value={draft.maxUploadMb}
                            aria-invalid={Boolean(shown('maxUploadMb'))}
                            onChange={(event) =>
                                setDraft({
                                    maxUploadMb: Number(event.target.value),
                                })
                            }
                            className="w-[9rem] font-mono"
                        />
                        <span className="font-mono text-[12px] text-muted-foreground">
                            MB per file
                        </span>
                    </div>
                </AdminSettingsField>
            </div>
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                An individual quota is set on the person, under{' '}
                <Link
                    to="/admin/users"
                    className="underline underline-offset-4"
                >
                    Users
                </Link>
                .
            </p>
        </>
    );
}

export default function LimitsPage() {
    return (
        <AppProviders>
            <AdminLayout>
                <AdminSettingsLayout>
                    <LimitsContent />
                </AdminSettingsLayout>
            </AdminLayout>
        </AppProviders>
    );
}
