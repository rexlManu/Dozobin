import { useForm, usePage } from '@inertiajs/react';
import { CheckCircle } from '@phosphor-icons/react';
import { AppProviders } from '@/components/app-providers';
import { AppShell } from '@/components/app-shell';
import { ChipGroup } from '@/components/chips';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TAKEDOWN_REASON_LABEL } from '@/lib/format';
import type { TakedownReason } from '@/lib/types';
import type { SharedPageProps } from '@/types';

interface TakedownPageProps extends SharedPageProps {
    /** The link to report, when the visitor came from a share page. */
    shareUrl: string;
}

const REASONS = Object.entries(TAKEDOWN_REASON_LABEL) as [
    TakedownReason,
    string,
][];

function TakedownForm({ shareUrl }: { shareUrl: string }) {
    const form = useForm({
        share_url: shareUrl,
        reason: 'copyright' as TakedownReason,
        details: '',
        reporter_name: '',
        reporter_email: '',
        good_faith: false,
    });

    return (
        <form
            className="grid gap-5"
            onSubmit={(event) => {
                event.preventDefault();
                form.post('/takedown', { preserveScroll: true });
            }}
        >
            <Field data-invalid={Boolean(form.errors.share_url)}>
                <FieldLabel htmlFor="takedown-url">
                    Link to the content
                </FieldLabel>
                <Input
                    id="takedown-url"
                    type="url"
                    inputMode="url"
                    placeholder="https://…/s/… or https://…/p/…"
                    className="font-mono text-[14px] md:text-[14px]"
                    value={form.data.share_url}
                    aria-invalid={Boolean(form.errors.share_url)}
                    onChange={(event) =>
                        form.setData('share_url', event.target.value)
                    }
                />
                <FieldError>{form.errors.share_url}</FieldError>
            </Field>

            <Field data-invalid={Boolean(form.errors.reason)}>
                <span className="label-meta">Reason</span>
                <ChipGroup
                    label="Reason"
                    value={form.data.reason}
                    onChange={(reason) => form.setData('reason', reason)}
                    options={REASONS.map(([value, label]) => ({
                        value,
                        label,
                    }))}
                />
                <FieldError>{form.errors.reason}</FieldError>
            </Field>

            <Field data-invalid={Boolean(form.errors.details)}>
                <FieldLabel htmlFor="takedown-details">
                    What is wrong
                </FieldLabel>
                <Textarea
                    id="takedown-details"
                    rows={5}
                    className="min-h-32"
                    placeholder="Say what the content is and why it should come down. For copyright, name the original work."
                    value={form.data.details}
                    aria-invalid={Boolean(form.errors.details)}
                    onChange={(event) =>
                        form.setData('details', event.target.value)
                    }
                />
                <FieldError>{form.errors.details}</FieldError>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
                <Field data-invalid={Boolean(form.errors.reporter_name)}>
                    <FieldLabel htmlFor="takedown-name">
                        Your name{' '}
                        <span className="font-medium text-muted-foreground">
                            (optional)
                        </span>
                    </FieldLabel>
                    <Input
                        id="takedown-name"
                        autoComplete="name"
                        value={form.data.reporter_name}
                        onChange={(event) =>
                            form.setData('reporter_name', event.target.value)
                        }
                    />
                    <FieldError>{form.errors.reporter_name}</FieldError>
                </Field>
                <Field data-invalid={Boolean(form.errors.reporter_email)}>
                    <FieldLabel htmlFor="takedown-email">Your email</FieldLabel>
                    <Input
                        id="takedown-email"
                        type="email"
                        autoComplete="email"
                        value={form.data.reporter_email}
                        aria-invalid={Boolean(form.errors.reporter_email)}
                        onChange={(event) =>
                            form.setData('reporter_email', event.target.value)
                        }
                    />
                    <FieldDescription>
                        Only for questions about this report.
                    </FieldDescription>
                    <FieldError>{form.errors.reporter_email}</FieldError>
                </Field>
            </div>

            <Field data-invalid={Boolean(form.errors.good_faith)}>
                <label className="flex items-start gap-3 rounded-[18px] bg-sunken px-4 py-3.5">
                    <Checkbox
                        className="mt-0.5"
                        checked={form.data.good_faith}
                        aria-invalid={Boolean(form.errors.good_faith)}
                        onCheckedChange={(checked) =>
                            form.setData('good_faith', checked === true)
                        }
                    />
                    <span className="leading-snug">
                        The information in this report is true and correct to
                        the best of my knowledge.
                    </span>
                </label>
                <FieldError>{form.errors.good_faith}</FieldError>
            </Field>

            <Button
                type="submit"
                size="lg"
                className="justify-self-start"
                disabled={form.processing}
            >
                Send report
            </Button>
        </form>
    );
}

function TakedownContent() {
    const { shareUrl, flash } = usePage<TakedownPageProps>().props;

    return (
        <AppShell
            head={
                <div className="grid max-w-[46rem] gap-3">
                    <h1 className="text-[32px] leading-tight font-bold sm:text-[44px]">
                        Report content
                    </h1>
                    <p className="text-muted-foreground">
                        Send a takedown request for content on this site that
                        breaks the law or someone's rights. The operator reviews
                        every report.
                    </p>
                </div>
            }
        >
            <div className="rail pb-16">
                <section className="max-w-[46rem] rounded-[28px] border-[1.5px] border-border bg-card p-[22px] sm:p-[30px]">
                    {flash.status ? (
                        <div className="rounded-[20px] bg-mint-soft px-4 py-4">
                            <p className="flex items-center gap-2 font-bold text-mint">
                                <CheckCircle weight="fill" className="size-5" />
                                Report sent
                            </p>
                            <p className="mt-1.5 text-muted-foreground">
                                {flash.status}
                            </p>
                        </div>
                    ) : (
                        <TakedownForm shareUrl={shareUrl} />
                    )}
                </section>
            </div>
        </AppShell>
    );
}

export default function TakedownPage() {
    return (
        <AppProviders>
            <TakedownContent />
        </AppProviders>
    );
}
