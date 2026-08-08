import { useForm, usePage } from '@inertiajs/react';
import { CheckCircle } from '@phosphor-icons/react';
import { AppProviders } from '@/components/app-providers';
import { AuthPanel as Panel } from '@/components/auth-panel';
import { Button } from '@/components/ui/button';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Link } from '@/lib/navigation';

function ResetContent() {
    const status = usePage<{ flash?: { status?: string } }>().props.flash
        ?.status;
    const form = useForm({ email: '' });

    return (
        <Panel
            title="Reset your password"
            intro="This installation sends the reset link through its configured mail service."
            footer={
                <Link
                    className="underline decoration-border-strong underline-offset-4"
                    to="/signin"
                >
                    Back to sign in
                </Link>
            }
        >
            {status ? (
                <div className="rounded-lg border border-border bg-card px-4 py-4">
                    <p className="flex items-center gap-2 text-[13.5px] font-medium">
                        <CheckCircle
                            weight="fill"
                            className="size-4 text-primary"
                        />
                        Reset link requested
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                        {status}
                    </p>
                </div>
            ) : (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post('/reset');
                    }}
                >
                    <FieldGroup>
                        <Field data-invalid={Boolean(form.errors.email)}>
                            <FieldLabel htmlFor="reset-email">Email</FieldLabel>
                            <Input
                                id="reset-email"
                                type="email"
                                autoComplete="email"
                                value={form.data.email}
                                aria-invalid={Boolean(form.errors.email)}
                                onChange={(event) =>
                                    form.setData('email', event.target.value)
                                }
                            />
                            <FieldError>{form.errors.email}</FieldError>
                        </Field>
                        <Button
                            type="submit"
                            size="lg"
                            disabled={form.processing}
                        >
                            Send reset link
                        </Button>
                    </FieldGroup>
                </form>
            )}
        </Panel>
    );
}

export default function ResetPage() {
    return (
        <AppProviders>
            <ResetContent />
        </AppProviders>
    );
}
