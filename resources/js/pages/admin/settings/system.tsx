import { useForm, usePage } from '@inertiajs/react';
import { ArrowUpRight, CheckCircle, Warning } from '@phosphor-icons/react';
import { updateTrackingCode } from '@/actions/App/Http/Controllers/Admin/InstallationSettingController';
import { AdminLayout } from '@/components/admin-layout';
import { AdminSettingsPageHead } from '@/components/admin-settings-layout';
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
}: {
    term: string;
    value: string;
    detail?: string;
}) {
    return (
        <div className="grid gap-1 border-t border-border py-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-5">
            <dt className="text-[12.5px] text-muted-foreground">{term}</dt>
            <dd className="min-w-0">
                <p className="font-mono text-[12.5px] break-all">{value}</p>
                {detail && (
                    <p className="mt-1 max-w-[65ch] text-[12px] leading-relaxed text-muted-foreground">
                        {detail}
                    </p>
                )}
            </dd>
        </div>
    );
}

function VersionStatus({ update }: { update: UpdateStatus }) {
    const releaseState = update.updateAvailable
        ? `${update.latestVersion} available`
        : update.latestVersion === null
          ? 'No release information'
          : 'Up to date';

    return (
        <>
            <header>
                <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
                    System
                </h2>
                <p className="mt-1.5 max-w-[62ch] text-[13px] leading-relaxed text-muted-foreground">
                    Build identity and release status for this installation.
                    Updates are installed by the deployment platform, never by
                    Dōzobin itself.
                </p>
            </header>

            <dl>
                <SystemRow
                    term="Installed version"
                    value={update.currentVersion}
                />
                <SystemRow
                    term="Source commit"
                    value={update.currentCommit ?? 'Development build'}
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
                            ? `Last checked ${dateTime(update.checkedAt)}. GitHub is queried at most once every 24 hours.`
                            : 'Update checks are disabled for this deployment or development build.'
                    }
                />
            </dl>

            {update.updateAvailable && update.releaseUrl !== null && (
                <div className="border-t border-border pt-4">
                    <Button size="sm" asChild>
                        <a
                            href={update.releaseUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            View {update.latestVersion} on GitHub
                            <ArrowUpRight aria-hidden />
                        </a>
                    </Button>
                </div>
            )}
        </>
    );
}

function TrackingCodeSetting({ encoded }: { encoded: string }) {
    const form = useForm({
        trackingCode: decodeTrackingCode(encoded),
    });

    return (
        <section className="border-t border-border pt-7">
            <AdminSettingsPageHead
                title="Tracking code"
                description="Add one external analytics script to every page. Leave this empty to disable tracking."
            />

            <div className="mt-5 flex flex-col gap-4">
                <Alert>
                    <Warning aria-hidden />
                    <AlertTitle>Runs for every visitor</AlertTitle>
                    <AlertDescription>
                        Only add code from a provider you trust. Changes take
                        effect after the next page load.
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
                            className="min-h-32 resize-y font-mono text-[12px] leading-relaxed"
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
                            handlers, and additional HTML are rejected.
                        </FieldDescription>
                        <FieldError>{form.errors.trackingCode}</FieldError>
                    </Field>

                    <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                        <p className="text-[12.5px] text-muted-foreground">
                            {form.recentlySuccessful ? (
                                <span className="flex items-center gap-1.5 text-foreground">
                                    <CheckCircle
                                        weight="fill"
                                        className="size-3.5 text-primary"
                                    />
                                    Saved
                                </span>
                            ) : form.isDirty ? (
                                'Unsaved changes'
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
            </div>
        </section>
    );
}

export default function SystemPage() {
    const { trackingCodeBase64, update } = usePage<SystemPageProps>().props;

    return (
        <AppProviders>
            <AdminLayout>
                <div className="flex flex-col gap-7">
                    {update === null ? (
                        <p className="text-[13px] text-muted-foreground">
                            Release status is available to administrators only.
                        </p>
                    ) : (
                        <VersionStatus update={update} />
                    )}
                    <TrackingCodeSetting encoded={trackingCodeBase64} />
                </div>
            </AdminLayout>
        </AppProviders>
    );
}
