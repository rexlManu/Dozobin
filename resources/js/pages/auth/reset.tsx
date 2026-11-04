import { useForm, usePage } from '@inertiajs/react';
import { CheckCircle } from '@phosphor-icons/react';
import { AppProviders } from '@/components/app-providers';
import { AuthPanel as Panel, authLinkClass } from '@/components/auth-panel';
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
            greeting="No worries."
            mood="calm"
            intro="Enter your email and we send you a reset link."
            footer={
                <Link className={authLinkClass} to="/signin">
                    Back to sign in
                </Link>
            }
        >
            {status ? (
                <div className="rounded-[20px] bg-mint-soft px-4 py-4">
                    <p className="flex items-center gap-2 font-bold text-mint">
                        <CheckCircle weight="fill" className="size-5" />
                        Reset link requested
                    </p>
                    <p className="mt-1.5 text-muted-foreground">{status}</p>
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
