import { router, usePage } from '@inertiajs/react';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AppProviders } from '@/components/app-providers';
import { useConfirm } from '@/components/confirm-dialog';
import { SettingsLayout, SettingsPageHead } from '@/components/settings-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNow } from '@/hooks/use-now';
import { relativeTime } from '@/lib/format';
import type { SharedPageProps } from '@/types';

function SecurityContent() {
    const now = useNow(30_000);
    const account = usePage<SharedPageProps>().props.auth.user;
    const { confirm, dialog } = useConfirm();

    const [passwords, setPasswords] = useState({
        current: '',
        next: '',
        confirm: '',
    });
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSaved, setPasswordSaved] = useState(false);

    if (!account) {
        return null;
    }

    return (
        <>
            <SettingsPageHead title="Security" />
            <div className="flex flex-col gap-6">
                <form
                    className="flex flex-col gap-3"
                    onSubmit={(event) => {
                        event.preventDefault();

                        if (passwords.next.length < 8) {
                            setPasswordError('Use at least eight characters.');

                            return;
                        }

                        if (passwords.next !== passwords.confirm) {
                            setPasswordError(
                                'The two new passwords do not match.',
                            );

                            return;
                        }

                        setPasswordError(null);
                        router.patch(
                            '/profile/password',
                            {
                                current_password: passwords.current,
                                password: passwords.next,
                                password_confirmation: passwords.confirm,
                            },
                            {
                                preserveScroll: true,
                                onSuccess: () => {
                                    setPasswords({
                                        current: '',
                                        next: '',
                                        confirm: '',
                                    });
                                    setPasswordSaved(true);
                                    window.setTimeout(
                                        () => setPasswordSaved(false),
                                        2500,
                                    );
                                },
                                onError: (errors) =>
                                    setPasswordError(
                                        errors.current_password ??
                                            errors.password ??
                                            'The password could not be updated.',
                                    ),
                            },
                        );
                    }}
                >
                    <p className="text-[13px] font-medium">Change password</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {(
                            [
                                ['current', 'Current'],
                                ['next', 'New'],
                                ['confirm', 'Repeat new'],
                            ] as const
                        ).map(([key, label]) => (
                            <div key={key} className="flex flex-col gap-2">
                                <Label
                                    htmlFor={`password-${key}`}
                                    className="text-[12.5px]"
                                >
                                    {label}
                                </Label>
                                <Input
                                    id={`password-${key}`}
                                    type="password"
                                    autoComplete={
                                        key === 'current'
                                            ? 'current-password'
                                            : 'new-password'
                                    }
                                    value={passwords[key]}
                                    aria-invalid={
                                        passwordError !== null &&
                                        key !== 'current'
                                    }
                                    onChange={(event) => {
                                        setPasswords((p) => ({
                                            ...p,
                                            [key]: event.target.value,
                                        }));
                                        setPasswordError(null);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    {passwordError && (
                        <p className="flex items-start gap-1.5 text-[12.5px] text-destructive">
                            <WarningCircle
                                weight="fill"
                                className="mt-px size-3.5 shrink-0"
                            />
                            {passwordError}
                        </p>
                    )}
                    <div className="flex items-center gap-3">
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!passwords.current || !passwords.next}
                        >
                            Update password
                        </Button>
                        {passwordSaved && (
                            <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                                <CheckCircle
                                    weight="fill"
                                    className="size-3.5 text-primary"
                                />{' '}
                                Updated
                            </span>
                        )}
                    </div>
                </form>

                <div>
                    <p className="text-[13px] font-medium">
                        Active login sessions
                    </p>
                    <ul className="mt-2.5 divide-y divide-border overflow-hidden rounded-lg border border-border">
                        {account.sessions.map((session) => (
                            <li
                                key={session.id}
                                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-medium">
                                        {session.device}
                                        {session.current && (
                                            <span className="ml-2 rounded-sm bg-primary-soft px-1.5 py-0.5 font-mono text-[10px] tracking-[0.06em] text-foreground uppercase">
                                                this device
                                            </span>
                                        )}
                                    </p>
                                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                                        {session.browser} · {session.location} ·{' '}
                                        {session.current
                                            ? 'active now'
                                            : relativeTime(
                                                  session.lastSeenAt,
                                                  now,
                                              )}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={session.current}
                                    onClick={async () => {
                                        const ok = await confirm({
                                            title: 'End this login session?',
                                            description: (
                                                <>
                                                    <span className="text-foreground">
                                                        {session.device}
                                                    </span>{' '}
                                                    will be signed out and has
                                                    to sign in again.
                                                </>
                                            ),
                                            confirmLabel: 'End session',
                                        });

                                        if (ok) {
                                            router.delete(
                                                `/profile/sessions/${session.id}`,
                                                { preserveScroll: true },
                                            );
                                        }
                                    }}
                                >
                                    End session
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="rounded-lg border border-destructive/30 bg-destructive-soft/50 px-4 py-3.5">
                    <p className="text-[13px] font-medium text-destructive">
                        Delete this account
                    </p>
                    <p className="mt-1 max-w-[58ch] text-[12.5px] leading-relaxed text-muted-foreground">
                        Every Share in the Library goes with it and every URL
                        stops resolving. Transfer Sessions are unaffected
                        because they never belonged to an account.
                    </p>
                    <Button
                        variant="danger"
                        size="sm"
                        className="mt-3"
                        onClick={async () => {
                            const ok = await confirm({
                                title: 'Delete the account?',
                                description:
                                    'This removes the account and all of its Shares. There is no recovery path, not even for the administrator.',
                                confirmLabel: 'Delete account',
                            });

                            if (ok) {
                                router.delete('/profile', {
                                    onSuccess: () => toast('Account deleted'),
                                });
                            }
                        }}
                    >
                        Delete account
                    </Button>
                </div>
            </div>
            {dialog}
        </>
    );
}

export default function SecurityPage() {
    return (
        <AppProviders>
            <SettingsLayout>
                <SecurityContent />
            </SettingsLayout>
        </AppProviders>
    );
}
