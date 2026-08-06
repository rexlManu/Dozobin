import { useForm, usePage } from '@inertiajs/react';
import { CheckCircle } from '@phosphor-icons/react';
import { Wordmark } from '@/components/brand';
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
import { useDozo } from '@/store/store';

function Panel({
    title,
    intro,
    children,
    footer,
}: {
    title: string;
    intro: string;
    children: React.ReactNode;
    footer: React.ReactNode;
}) {
    return (
        <div className="bg-background flex min-h-[100dvh] flex-col">
            <div className="mx-auto flex w-full max-w-[24.5rem] flex-1 flex-col justify-center px-4 py-12 sm:py-16">
                <Link
                    to="/"
                    aria-label="Dōzobin home"
                    className="mb-9 w-fit rounded-md focus-visible:outline-2"
                >
                    <Wordmark />
                </Link>
                <h1 className="text-xl font-medium tracking-[-0.02em]">
                    {title}
                </h1>
                <p className="text-muted-foreground mt-2 text-[13.5px] leading-relaxed">
                    {intro}
                </p>
                <div className="mt-7">{children}</div>
                <div className="border-border text-muted-foreground mt-6 border-t pt-4 text-[13px]">
                    {footer}
                </div>
            </div>
        </div>
    );
}

export function SignInRoute() {
    const development = import.meta.env.DEV;
    const form = useForm({
        email: development ? 'member@dozobin.test' : '',
        password: development ? 'password' : '',
        remember: false,
    });

    return (
        <Panel
            title="Sign in"
            intro="Membership adds a Library, settings, and API tokens. Sharing itself works without it."
            footer={
                <>
                    <span>No account yet? </span>
                    <Link
                        className="decoration-border-strong underline underline-offset-4"
                        to="/register"
                    >
                        Register
                    </Link>
                    <span> · </span>
                    <Link
                        className="decoration-border-strong underline underline-offset-4"
                        to="/reset"
                    >
                        Forgot password
                    </Link>
                </>
            }
        >
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post('/signin', {
                        onFinish: () => form.reset('password'),
                    });
                }}
            >
                <FieldGroup>
                    <Field data-invalid={Boolean(form.errors.email)}>
                        <FieldLabel htmlFor="signin-email">Email</FieldLabel>
                        <Input
                            id="signin-email"
                            type="email"
                            autoComplete="username"
                            value={form.data.email}
                            aria-invalid={Boolean(form.errors.email)}
                            onChange={(event) =>
                                form.setData('email', event.target.value)
                            }
                        />
                        <FieldError>{form.errors.email}</FieldError>
                    </Field>
                    <Field data-invalid={Boolean(form.errors.password)}>
                        <FieldLabel htmlFor="signin-password">
                            Password
                        </FieldLabel>
                        <Input
                            id="signin-password"
                            type="password"
                            autoComplete="current-password"
                            value={form.data.password}
                            aria-invalid={Boolean(form.errors.password)}
                            onChange={(event) =>
                                form.setData('password', event.target.value)
                            }
                        />
                        <FieldError>{form.errors.password}</FieldError>
                    </Field>
                    <Button type="submit" size="lg" disabled={form.processing}>
                        Sign in
                    </Button>
                </FieldGroup>
            </form>
            {development && (
                <div className="border-border bg-sunken text-muted-foreground mt-5 rounded-md border px-3 py-2.5 font-mono text-[11px] leading-relaxed">
                    <p className="text-foreground">Local seeded accounts</p>
                    <p>member@dozobin.test · member</p>
                    <p>admin@dozobin.test · administrator</p>
                    <p>password</p>
                </div>
            )}
        </Panel>
    );
}

export function RegisterRoute() {
    const registration = useDozo((state) => state.adminConfig.registration);
    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        invite: '',
    });

    if (registration === 'closed') {
        return (
            <Panel
                title="Registration is closed"
                intro="The administrator of this installation is not taking new accounts. Guest sharing and Transfer Sessions still work."
                footer={
                    <Link
                        className="decoration-border-strong underline underline-offset-4"
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
                        className="decoration-border-strong underline underline-offset-4"
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

export function ResetRoute() {
    const status = usePage<{ flash?: { status?: string } }>().props.flash
        ?.status;
    const form = useForm({ email: '' });

    return (
        <Panel
            title="Reset your password"
            intro="This installation sends the reset link through its configured mail service."
            footer={
                <Link
                    className="decoration-border-strong underline underline-offset-4"
                    to="/signin"
                >
                    Back to sign in
                </Link>
            }
        >
            {status ? (
                <div className="border-border bg-card rounded-lg border px-4 py-4">
                    <p className="flex items-center gap-2 text-[13.5px] font-medium">
                        <CheckCircle
                            weight="fill"
                            className="text-primary size-4"
                        />
                        Reset link requested
                    </p>
                    <p className="text-muted-foreground mt-1.5 text-[13px] leading-relaxed">
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
