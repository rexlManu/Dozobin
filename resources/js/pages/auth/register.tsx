import { useForm, usePage } from '@inertiajs/react';
import { AppProviders } from '@/components/app-providers';
import { AuthPanel as Panel } from '@/components/auth-panel';
import { Button } from '@/components/ui/button';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Link } from '@/lib/navigation';
import type { SharedPageProps } from '@/types';

interface RegisterPageProps extends SharedPageProps {
    initialInvite: string;
    inviteAvailable: boolean | null;
}

function RegisterContent() {
    const { config, initialInvite, inviteAvailable } =
        usePage<RegisterPageProps>().props;
    const registration = config.registration;
    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        invite: initialInvite,
    });

    if (registration === 'closed') {
        return (
            <Panel
                title="Registration is closed"
                intro="The administrator of this installation is not taking new accounts. Guest sharing and Transfer Sessions still work."
                footer={
                    <Link
                        className="underline decoration-border-strong underline-offset-4"
                        to="/"
                    >
                        Back to the workspace
                    </Link>
                }
            >
                <Button asChild size="lg">
                    <Link to="/">Share as a Guest</Link>
                </Button>
            </Panel>
        );
    }

    if (registration === 'invite' && inviteAvailable === false) {
        return (
            <Panel
                title="Invite link unavailable"
                intro="This invite is invalid, expired, revoked, or has reached its use limit. Ask the administrator for a new link."
                footer={
                    <Link
                        className="underline decoration-border-strong underline-offset-4"
                        to="/"
                    >
                        Back to the workspace
                    </Link>
                }
            >
                <Button asChild size="lg">
                    <Link to="/">Go to the workspace</Link>
                </Button>
            </Panel>
        );
    }

    return (
        <Panel
            title="Create an account"
            intro={
                registration === 'invite'
                    ? 'This installation is invite only, so registration needs a code from the administrator.'
                    : 'Registration is open on this installation.'
            }
            footer={
                <>
                    <span>Already have one? </span>
                    <Link
                        className="underline decoration-border-strong underline-offset-4"
                        to="/signin"
                    >
                        Sign in
                    </Link>
                </>
            }
        >
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post('/register', {
                        onFinish: () =>
                            form.reset('password', 'password_confirmation'),
                    });
                }}
            >
                <FieldGroup>
                    <Field data-invalid={Boolean(form.errors.name)}>
                        <FieldLabel htmlFor="register-name">Name</FieldLabel>
                        <Input
                            id="register-name"
                            autoComplete="name"
                            value={form.data.name}
                            aria-invalid={Boolean(form.errors.name)}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                        />
                        <FieldError>{form.errors.name}</FieldError>
                    </Field>
                    <Field data-invalid={Boolean(form.errors.email)}>
                        <FieldLabel htmlFor="register-email">Email</FieldLabel>
                        <Input
                            id="register-email"
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
                    <Field data-invalid={Boolean(form.errors.password)}>
                        <FieldLabel htmlFor="register-password">
                            Password
                        </FieldLabel>
                        <Input
                            id="register-password"
                            type="password"
                            autoComplete="new-password"
                            value={form.data.password}
                            aria-invalid={Boolean(form.errors.password)}
                            onChange={(event) =>
                                form.setData('password', event.target.value)
                            }
                        />
                        <FieldError>{form.errors.password}</FieldError>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="register-confirmation">
                            Confirm password
                        </FieldLabel>
                        <Input
                            id="register-confirmation"
                            type="password"
                            autoComplete="new-password"
                            value={form.data.password_confirmation}
                            onChange={(event) =>
                                form.setData(
                                    'password_confirmation',
                                    event.target.value,
                                )
                            }
                        />
                    </Field>
                    {registration === 'invite' && (
                        <Field data-invalid={Boolean(form.errors.invite)}>
                            <FieldLabel htmlFor="register-invite">
                                Invite code
                            </FieldLabel>
                            <Input
                                id="register-invite"
                                value={form.data.invite}
                                aria-invalid={Boolean(form.errors.invite)}
                                onChange={(event) =>
                                    form.setData('invite', event.target.value)
                                }
                            />
                            <FieldDescription>
                                Ask the administrator of this installation.
                            </FieldDescription>
                            <FieldError>{form.errors.invite}</FieldError>
                        </Field>
                    )}
                    <Button type="submit" size="lg" disabled={form.processing}>
                        Create account
                    </Button>
                </FieldGroup>
            </form>
        </Panel>
    );
}

export default function RegisterPage() {
    return (
        <AppProviders>
            <RegisterContent />
        </AppProviders>
    );
}
