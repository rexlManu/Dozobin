import { router, usePage } from '@inertiajs/react';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AppProviders } from '@/components/app-providers';
import { useConfirm } from '@/components/confirm-dialog';
import { SettingsCard, SettingsLayout } from '@/components/settings-layout';
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
            <SettingsCard title="Change password">
                <form
                    className="flex flex-col gap-4"
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
                    <div className="grid gap-4 sm:grid-cols-3">
                        {(
                            [
                                ['current', 'Current'],
                                ['next', 'New'],
                                ['confirm', 'Repeat new'],
                            ] as const
                        ).map(([key, label]) => (
                            <div key={key} className="flex flex-col gap-2">
                                <Label htmlFor={`password-${key}`}>
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
                        <p
                            role="alert"
                            className="flex items-start gap-2 text-[14px] font-bold text-destructive"
                        >
                            <WarningCircle
                                weight="fill"
                                className="mt-0.5 size-4 shrink-0"
                            />
                            {passwordError}
                        </p>
                    )}
                    <div className="flex items-center gap-3">
                        <Button
                            type="submit"
                            disabled={!passwords.current || !passwords.next}
                        >
                            Update password
                        </Button>
                        {passwordSaved && (
                            <span className="flex items-center gap-1.5 font-bold text-mint">
                                <CheckCircle weight="fill" className="size-4" />
                                Updated
                            </span>
                        )}
                    </div>
                </form>
            </SettingsCard>

            <SettingsCard
                title="Login sessions"
                description="Browsers that are signed in to this account."
            >
                {account.sessions.length === 0 ? (
                    <p className="rounded-[20px] bg-sunken px-4 py-3 text-muted-foreground">
                        No login sessions to show.
                    </p>
                ) : (
                    <ul className="grid gap-1.5">
                        {account.sessions.map((session) => (
                            <li
                                key={session.id}
                                className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[20px] bg-sunken py-3 pr-3 pl-4"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-bold">
                                        {session.device}
                                        {session.current && (
                                            <span className="rounded-[10px] bg-primary-soft px-2 py-0.5 text-[13px] font-bold text-primary">
                                                This device
                                            </span>
                                        )}
                                    </p>
                                    <p className="mt-0.5 text-[14px] text-muted-foreground">
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
                )}
            </SettingsCard>

            <SettingsCard
                danger
                title="Delete this account"
                description="Every File Share and Paste in your Library goes with it, and their Share URLs stop working. Transfer Sessions are not affected."
            >
                <div>
                    <Button
                        variant="danger"
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
            </SettingsCard>
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
