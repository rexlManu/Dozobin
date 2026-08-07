import { router, usePage } from '@inertiajs/react';
import {
    CheckCircle,
    DownloadSimple,
    Plus,
    WarningCircle,
} from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AppShell } from '@/components/app-shell';
import { useConfirm } from '@/components/confirm-dialog';
import { CopyButton } from '@/components/copy-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { downloadText } from '@/lib/download';
import {
    EXPIRATION_LABEL,
    EXPIRATION_ORDER,
    formatBytes,
    formatDateTime,
    relativeTime,
} from '@/lib/format';
import { NavLink } from '@/lib/navigation';
import type { Appearance, ExpirationKey } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

const SECTIONS = [
    { to: '/settings/profile', label: 'Profile' },
    { to: '/settings/appearance', label: 'Appearance' },
    { to: '/settings/sharing', label: 'Sharing defaults' },
    { to: '/settings/storage', label: 'Storage' },
    { to: '/settings/security', label: 'Security' },
    { to: '/settings/tokens', label: 'API tokens' },
    { to: '/settings/sharex', label: 'ShareX' },
];

function maskSecret(secret: string) {
    return `${secret.slice(0, 9)}${'•'.repeat(12)}${secret.slice(-4)}`;
}

/** The heading every settings page carries, so they open the same way. */
function PageHead({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
        <header>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
                {title}
            </h2>
            {description && (
                <p className="mt-1.5 max-w-[62ch] text-[13px] leading-relaxed text-muted-foreground">
                    {description}
                </p>
            )}
        </header>
    );
}

export function SettingsLayout({ children }: { children: ReactNode }) {
    return (
        <AppShell>
            <div className="rail py-6 sm:py-8">
                <h1 className="text-xl font-medium tracking-[-0.02em]">
                    Settings
                </h1>

                <div className="mt-6 grid gap-7 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10">
                    {/*
            The indicator is the header's own device turned on its side: a
            hairline the active item sits against, ink rather than yuzu, because
            the accent belongs to acts and never to navigation.
          */}
                    <nav className="-mx-4 flex scrollbar-slim gap-1 overflow-x-auto border-b border-border px-4 lg:sticky lg:top-20 lg:mx-0 lg:flex-col lg:gap-0.5 lg:self-start lg:overflow-visible lg:border-b-0 lg:border-l lg:px-0">
                        {SECTIONS.map((section) => (
                            <NavLink
                                key={section.to}
                                to={section.to}
                                className={({ isActive }) =>
                                    cn(
                                        'relative shrink-0 px-2.5 py-2 text-[13px] transition-colors lg:py-1.5',
                                        isActive
                                            ? 'font-medium text-foreground'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <span
                                                aria-hidden
                                                className="absolute inset-x-2 -bottom-px h-[1.5px] bg-foreground lg:inset-x-auto lg:inset-y-1 lg:-left-px lg:h-auto lg:w-[1.5px]"
                                            />
                                        )}
                                        {section.label}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="flex min-w-0 flex-col gap-5">
                        {children}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

export function ProfileSettings() {
    const account = usePage<SharedPageProps>().props.auth.user;
    const avatarInput = useRef<HTMLInputElement>(null);
    const [name, setName] = useState(account?.name ?? '');
    const [email, setEmail] = useState(account?.email ?? '');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!saved) {
            return;
        }

        const timer = window.setTimeout(() => setSaved(false), 2500);

        return () => window.clearTimeout(timer);
    }, [saved]);

    if (!account) {
        return null;
    }

    return (
        <>
            <PageHead title="Profile" />
            <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                    <Avatar className="size-14 rounded-lg">
                        <AvatarImage
                            src={account.avatarSrc}
                            alt=""
                            className="rounded-lg"
                        />
                        <AvatarFallback className="rounded-lg">
                            {account.name.slice(0, 2)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => avatarInput.current?.click()}
                        >
                            Change avatar
                        </Button>
                        <input
                            ref={avatarInput}
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(event) => {
                                const file = event.target.files?.[0];

                                if (file !== undefined) {
                                    router.post(
                                        '/profile',
                                        { _method: 'PATCH', avatar: file },
                                        {
                                            forceFormData: true,
                                            preserveScroll: true,
                                        },
                                    );
                                }

                                event.target.value = '';
                            }}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                router.patch(
                                    '/profile',
                                    { remove_avatar: true },
                                    { preserveScroll: true },
                                )
                            }
                        >
                            Remove
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="profile-name">Name</Label>
                        <Input
                            id="profile-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="profile-email">Email</Label>
                        <Input
                            id="profile-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        size="sm"
                        disabled={
                            name === account.name && email === account.email
                        }
                        onClick={() => {
                            router.patch(
                                '/profile',
                                { name, email },
                                {
                                    preserveScroll: true,
                                    onSuccess: () => setSaved(true),
                                },
                            );
                        }}
                    >
                        Save profile
                    </Button>
                    {saved && (
                        <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                            <CheckCircle
                                weight="fill"
                                className="size-3.5 text-primary"
                            />{' '}
                            Saved
                        </span>
                    )}
                </div>
            </div>
        </>
    );
}

export function AppearanceSettings() {
    const appearance = usePage<SharedPageProps>().props.appearance;

    return (
        <>
            <PageHead
                title="Appearance"
                description="System follows whatever the device is set to and changes with it."
            />
            <ToggleGroup
                type="single"
                variant="outline"
                value={appearance}
                onValueChange={(value) =>
                    value &&
                    router.patch(
                        '/profile',
                        { appearance: value as Appearance },
                        { preserveScroll: true },
                    )
                }
            >
                <ToggleGroupItem value="light">Light</ToggleGroupItem>
                <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
                <ToggleGroupItem value="system">System</ToggleGroupItem>
            </ToggleGroup>
        </>
    );
}

export function SharingSettings() {
    const { auth, config } = usePage<SharedPageProps>().props;
    const account = auth.user;

    if (!account) {
        return null;
    }

    return (
        <>
            <PageHead
                title="Sharing defaults"
                description="Preselected on the Drop Workspace. The installation decides which windows exist at all."
            />
            <div className="flex flex-col gap-2 sm:max-w-[16rem]">
                <Label htmlFor="default-expiration">
                    Default Share Expiration
                </Label>
                <Select
                    value={account.defaultExpiration}
                    onValueChange={(value) =>
                        router.patch(
                            '/profile',
                            {
                                default_expiration: value as ExpirationKey,
                            },
                            { preserveScroll: true },
                        )
                    }
                >
                    <SelectTrigger id="default-expiration">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {EXPIRATION_ORDER.filter((key) =>
                            config.memberExpirations.includes(key),
                        ).map((key) => (
                            <SelectItem key={key} value={key}>
                                {EXPIRATION_LABEL[key]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </>
    );
}

export function StorageSettings() {
    const account = usePage<SharedPageProps>().props.auth.user;

    if (!account) {
        return null;
    }

    const ratio = account.storageUsed / account.storageLimit;
    const tight = ratio > 0.9;

    return (
        <>
            <PageHead
                title="Storage"
                description="The limit is assigned by whoever runs this installation. You cannot raise it from here."
            />
            <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-mono text-[13px]">
                        {formatBytes(account.storageUsed)}{' '}
                        <span className="text-muted-foreground">
                            of {formatBytes(account.storageLimit)}
                        </span>
                    </p>
                    <p
                        className={cn(
                            'font-mono text-[12px]',
                            tight
                                ? 'text-destructive'
                                : 'text-muted-foreground',
                        )}
                    >
                        {Math.round(ratio * 1000) / 10}% used
                    </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                        className={cn(
                            'h-full rounded-full',
                            tight ? 'bg-destructive' : 'bg-primary',
                        )}
                        style={{
                            width: `${Math.min(100, Math.max(2, ratio * 100))}%`,
                        }}
                    />
                </div>
                {tight && (
                    <p className="mt-3 flex items-start gap-1.5 text-[12.5px] text-destructive">
                        <WarningCircle
                            weight="fill"
                            className="mt-px size-3.5 shrink-0"
                        />
                        Uploads will be refused until something is deleted or
                        the administrator raises the quota.
                    </p>
                )}
            </div>
        </>
    );
}

export function SecuritySettings() {
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
            <PageHead title="Security" />
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
                                            : relativeTime(session.lastSeenAt)}
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

export function TokensSettings() {
    const account = usePage<SharedPageProps>().props.auth.user;
    const { confirm, dialog } = useConfirm();

    const [tokenName, setTokenName] = useState('');
    const [hiddenSecrets, setHiddenSecrets] = useState<Set<string>>(
        () => new Set(),
    );

    if (!account) {
        return null;
    }

    return (
        <>
            <PageHead
                title="API tokens"
                description="A token stands in for the account when a program creates a File Share. The full secret is shown once, at creation."
            />
            <div className="flex flex-col gap-4">
                <form
                    className="flex flex-wrap items-end gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();

                        if (!tokenName.trim()) {
                            return;
                        }

                        router.post(
                            '/api-tokens',
                            { name: tokenName.trim() },
                            {
                                preserveScroll: true,
                                onSuccess: () => setTokenName(''),
                            },
                        );
                    }}
                >
                    <div className="flex min-w-[14rem] flex-1 flex-col gap-2">
                        <Label htmlFor="token-name">New token name</Label>
                        <Input
                            id="token-name"
                            value={tokenName}
                            placeholder="What will use it"
                            onChange={(event) =>
                                setTokenName(event.target.value)
                            }
                        />
                    </div>
                    <Button type="submit" disabled={!tokenName.trim()}>
                        <Plus /> Create token
                    </Button>
                </form>

                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                    {account.tokens.map((token) => (
                        <li key={token.id} className="px-3 py-3">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <div className="min-w-0 flex-1">
                                    <p
                                        className={cn(
                                            'text-[13px] font-medium',
                                            token.revoked &&
                                                'text-muted-foreground line-through',
                                        )}
                                    >
                                        {token.name}
                                    </p>
                                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                                        created{' '}
                                        {formatDateTime(token.createdAt)} ·{' '}
                                        {token.revoked
                                            ? 'revoked'
                                            : token.lastUsedAt
                                              ? `last used ${relativeTime(token.lastUsedAt)}`
                                              : 'never used'}
                                    </p>
                                </div>
                                {!token.revoked && (
                                    <div className="flex items-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={async () => {
                                                const ok = await confirm({
                                                    title: 'Revoke this token?',
                                                    description: (
                                                        <>
                                                            Anything using{' '}
                                                            <span className="text-foreground">
                                                                {token.name}
                                                            </span>{' '}
                                                            stops working
                                                            immediately. Shares
                                                            it already created
                                                            stay.
                                                        </>
                                                    ),
                                                    confirmLabel: 'Revoke',
                                                });

                                                if (ok) {
                                                    router.delete(
                                                        `/api-tokens/${token.id}`,
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    );
                                                }
                                            }}
                                        >
                                            Revoke
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <p className="mt-2 rounded-md border border-border bg-sunken px-2.5 py-1.5 font-mono text-[11.5px] break-all">
                                {token.revoked
                                    ? 'revoked'
                                    : token.justCreated
                                      ? hiddenSecrets.has(token.id)
                                          ? maskSecret(token.secret)
                                          : token.secret
                                      : token.secret}
                            </p>

                            {token.justCreated &&
                                !hiddenSecrets.has(token.id) && (
                                    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-primary/40 bg-primary-soft/40 px-2.5 py-2">
                                        <p className="mr-auto text-[12px] text-foreground">
                                            Copy it now. Dōzobin will not show
                                            it again.
                                        </p>
                                        <CopyButton
                                            value={token.secret}
                                            size="sm"
                                            label="Copy"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                setHiddenSecrets((current) => {
                                                    const next = new Set(
                                                        current,
                                                    );
                                                    next.add(token.id);

                                                    return next;
                                                })
                                            }
                                        >
                                            Hide
                                        </Button>
                                    </div>
                                )}
                        </li>
                    ))}
                </ul>
            </div>
            {dialog}
        </>
    );
}

export function SharexSettings() {
    const account = usePage<SharedPageProps>().props.auth.user;

    const sharexConfig = useMemo(() => {
        const token = account?.tokens.find((t) => !t.revoked);

        return JSON.stringify(
            {
                Version: '17.0.0',
                Name: 'Dozobin',
                DestinationType: 'ImageUploader, TextUploader, FileUploader',
                RequestMethod: 'POST',
                RequestURL: `${typeof window === 'undefined' ? 'https://dozobin.example' : window.location.origin}/api/v1/shares`,
                Headers: {
                    Authorization: `Bearer ${token ? maskSecret(token.secret) : '<api token>'}`,
                },
                Body: 'MultipartFormData',
                FileFormName: 'file',
                Arguments: { expiration: account?.defaultExpiration ?? '7d' },
                URL: '{json:url}',
                DeletionURL: '{json:delete_url}',
            },
            null,
            2,
        );
    }, [account]);

    if (!account) {
        return null;
    }

    return (
        <>
            <PageHead
                title="ShareX"
                description="ShareX is not a separate kind of upload. It calls the API with a token and gets back a regular File Share, the same thing the Drop Workspace makes."
            />
            <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
                    <p className="mr-auto font-mono text-[11.5px] text-muted-foreground">
                        dozobin.sxcu
                    </p>
                    <CopyButton
                        value={sharexConfig}
                        size="sm"
                        label="Copy config"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            downloadText(sharexConfig, 'dozobin.sxcu')
                        }
                    >
                        <DownloadSimple /> Download
                    </Button>
                </div>
                <pre className="scrollbar-slim overflow-x-auto px-4 py-3.5 font-mono text-[11.5px] leading-[1.7]">
                    {sharexConfig}
                </pre>
                <p className="border-t border-border px-4 py-2.5 text-[12px] leading-relaxed text-muted-foreground">
                    The token is masked in this preview. Put a real one in the
                    Authorization header before importing. The token authorizes
                    uploads against this installation's API.
                </p>
            </div>
        </>
    );
}
