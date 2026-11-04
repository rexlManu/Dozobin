import { useForm, usePage } from '@inertiajs/react';
import { ArrowUpRight, CheckCircle, Warning } from '@phosphor-icons/react';
import { updateTrackingCode } from '@/actions/App/Http/Controllers/Admin/InstallationSettingController';
import {
    AdminCard,
    AdminLayout,
    AdminPageHead,
    Tag,
} from '@/components/admin-layout';
import { AdminSettingsFrame } from '@/components/admin-settings-layout';
import { AppProviders } from '@/components/app-providers';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldLabel,
} from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import type { UpdateStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

interface SystemPageProps extends SharedPageProps {
    trackingCodeBase64: string;
}

function decodeTrackingCode(encoded: string): string {
    try {
        const bytes = Uint8Array.from(globalThis.atob(encoded), (character) =>
            character.charCodeAt(0),
        );

        return new TextDecoder().decode(bytes);
    } catch {
        return '';
    }
}

function dateTime(value: string | number | null) {
    if (value === null) {
        return 'Not available';
    }

    const date = new Date(typeof value === 'number' ? value * 1000 : value);

    if (Number.isNaN(date.getTime())) {
        return 'Not available';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

function SystemRow({
    term,
    value,
    detail,
    mono = false,
}: {
    term: string;
    value: React.ReactNode;
    detail?: string;
    mono?: boolean;
}) {
    return (
        <div className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-5">
            <dt className="label-meta sm:pt-0.5">{term}</dt>
            <dd className="min-w-0">
                <div
                    className={cn(
                        'font-bold break-all',
                        mono && 'font-mono text-[14px] font-normal',
                    )}
                >
                    {value}
                </div>
                {detail && (
                    <p className="mt-1 max-w-[65ch] text-[14px] text-muted-foreground">
                        {detail}
                    </p>
                )}
            </dd>
        </div>
    );
}

function VersionStatus({ update }: { update: UpdateStatus }) {
    const releaseState = update.updateAvailable ? (
        <Tag tone="lavender">{update.latestVersion} available</Tag>
    ) : update.latestVersion === null ? (
        <Tag tone="muted">No release information</Tag>
    ) : (
        <Tag tone="mint">Up to date</Tag>
    );

    return (
        <>
            <AdminPageHead
                title="Release"
                description="Your deployment platform installs updates, never Dōzobin itself."
                action={
                    update.updateAvailable &&
                    update.releaseUrl !== null && (
                        <Button asChild>
                            <a
                                href={update.releaseUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                View {update.latestVersion} on GitHub
                                <ArrowUpRight aria-hidden />
                            </a>
                        </Button>
                    )
                }
            />

            <AdminCard>
                <dl className="grid">
                    <SystemRow
                        term="Installed version"
                        value={update.currentVersion}
                        mono
                    />
                    <SystemRow
                        term="Source commit"
                        value={update.currentCommit ?? 'Development build'}
                        mono={update.currentCommit !== null}
                    />
                    <SystemRow
                        term="Image built"
                        value={dateTime(update.builtAt)}
                    />
                    <SystemRow
                        term="Release status"
                        value={releaseState}
                        detail={
                            update.checksEnabled
                                ? `Last checked ${dateTime(update.checkedAt)}. GitHub is asked at most once a day.`
                                : 'Update checks are off for this deployment or development build.'
                        }
                    />
                </dl>
            </AdminCard>
        </>
    );
}

function TrackingCodeSetting({ encoded }: { encoded: string }) {
    const form = useForm({
        trackingCode: decodeTrackingCode(encoded),
    });

    return (
        <section className="grid gap-4">
            <AdminPageHead
                title="Tracking code"
                description="One external analytics script on every page. Leave empty to turn tracking off."
            />

            <AdminCard className="flex flex-col gap-5">
                <Alert>
                    <Warning aria-hidden />
                    <AlertTitle>Runs for every visitor</AlertTitle>
                    <AlertDescription>
                        Only add code from a provider you trust. It applies on
                        the next page load.
                    </AlertDescription>
                </Alert>

                <form
                    className="flex flex-col gap-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.submit(updateTrackingCode(), {
                            preserveScroll: true,
                            onSuccess: () => form.setDefaults(),
                        });
                    }}
                >
                    <Field data-invalid={Boolean(form.errors.trackingCode)}>
                        <FieldLabel htmlFor="tracking-code">
                            Script tag
                        </FieldLabel>
                        <Textarea
                            id="tracking-code"
                            className="field-sizing-fixed min-h-32 w-full resize-y font-mono text-[13px] leading-relaxed"
                            value={form.data.trackingCode}
                            placeholder={
                                '<script defer src="https://analytics.example.com/script.js" data-website-id="…"></script>'
                            }
                            spellCheck={false}
                            aria-invalid={Boolean(form.errors.trackingCode)}
                            onChange={(event) =>
                                form.setData('trackingCode', event.target.value)
                            }
                        />
                        <FieldDescription>
                            One HTTPS script tag. Inline JavaScript, event
                            handlers and other HTML are rejected.
                        </FieldDescription>
                        <FieldError>{form.errors.trackingCode}</FieldError>
                    </Field>

                    <div className="flex flex-wrap items-center gap-3">
                        <p className="text-[14px] text-muted-foreground">
                            {form.recentlySuccessful ? (
                                <span className="flex items-center gap-1.5 font-bold text-mint">
                                    <CheckCircle
                                        weight="fill"
                                        className="size-4"
                                    />
                                    Saved
                                </span>
                            ) : form.isDirty ? (
                                <span className="font-bold text-lamp">
                                    Unsaved changes
                                </span>
                            ) : (
                                'No changes'
                            )}
                        </p>
                        <div className="ml-auto flex items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={!form.isDirty || form.processing}
                                onClick={() => form.resetAndClearErrors()}
                            >
                                Discard
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={!form.isDirty || form.processing}
                            >
                                Save tracking code
                            </Button>
                        </div>
                    </div>
                </form>
            </AdminCard>
        </section>
    );
}

export default function SystemPage() {
    const { trackingCodeBase64, update } = usePage<SystemPageProps>().props;

    return (
        <AppProviders>
            <AdminLayout>
                <AdminSettingsFrame current="system">
                    <div className="flex flex-col gap-8">
                        {update === null ? (
                            <p className="text-muted-foreground">
                                Release status is available to administrators
                                only.
                            </p>
                        ) : (
                            <VersionStatus update={update} />
                        )}
                        <TrackingCodeSetting encoded={trackingCodeBase64} />
                    </div>
                </AdminSettingsFrame>
            </AdminLayout>
        </AppProviders>
    );
}
