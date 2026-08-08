import { useForm } from '@inertiajs/react';
import { AppProviders } from '@/components/app-providers';
import { InstallShell } from '@/components/install-shell';
import { Button } from '@/components/ui/button';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

function AccountContent() {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    return (
        <InstallShell
            step="account"
            title="Create the administrator"
            intro="This account owns Administration: every site setting, every Member, every upload on the server. It is the only account the installer creates, and this page closes as soon as it exists."
        >
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post('/install/account', {
                        onFinish: () =>
                            form.reset('password', 'password_confirmation'),
                    });
                }}
                className="max-w-[24.5rem]"
            >
                <FieldGroup>
                    <Field data-invalid={Boolean(form.errors.name)}>
                        <FieldLabel htmlFor="install-name">Name</FieldLabel>
                        <Input
                            id="install-name"
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
                        <FieldLabel htmlFor="install-email">Email</FieldLabel>
                        <Input
                            id="install-email"
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
                        <FieldLabel htmlFor="install-password">
                            Password
                        </FieldLabel>
                        <Input
                            id="install-password"
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
                        <FieldLabel htmlFor="install-confirmation">
                            Confirm password
                        </FieldLabel>
                        <Input
                            id="install-confirmation"
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
                    <Button type="submit" size="lg" disabled={form.processing}>
                        Create administrator
                    </Button>
                </FieldGroup>
            </form>
        </InstallShell>
    );
}

export default function InstallAccountPage() {
    return (
        <AppProviders>
            <AccountContent />
        </AppProviders>
    );
}
