import { useForm } from '@inertiajs/react';
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
            greeting="Welcome back."
            intro="Members get a Library, settings and API tokens. You can share without an account."
            footer={
                <>
                    <span>No account yet? </span>
                    <Link className={authLinkClass} to="/register">
                        Register
                    </Link>
                    <span className="mx-2">·</span>
                    <Link className={authLinkClass} to="/reset">
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
                <div className="mt-5 rounded-[18px] bg-sunken px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
                    <p className="font-bold text-foreground">
                        Local seeded accounts
                    </p>
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
