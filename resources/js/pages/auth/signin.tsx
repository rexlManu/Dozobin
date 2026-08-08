import { useForm } from '@inertiajs/react';
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

function SignInContent() {
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
                        className="underline decoration-border-strong underline-offset-4"
                        to="/register"
                    >
                        Register
                    </Link>
                    <span> · </span>
                    <Link
                        className="underline decoration-border-strong underline-offset-4"
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
                <div className="mt-5 rounded-md border border-border bg-sunken px-3 py-2.5 font-mono text-[11px] leading-relaxed text-muted-foreground">
                    <p className="text-foreground">Local seeded accounts</p>
                    <p>member@dozobin.test · member</p>
                    <p>admin@dozobin.test · administrator</p>
                    <p>password</p>
                </div>
            )}
        </Panel>
    );
}

export default function SignInPage() {
    return (
        <AppProviders>
            <SignInContent />
        </AppProviders>
    );
}
