import { router, usePage } from '@inertiajs/react';
import { Plus } from '@phosphor-icons/react';
import { useState } from 'react';
import { AppProviders } from '@/components/app-providers';
import { useConfirm } from '@/components/confirm-dialog';
import { CopyButton } from '@/components/copy-button';
import { SettingsCard, SettingsLayout } from '@/components/settings-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNow } from '@/hooks/use-now';
import { maskApiToken } from '@/lib/api-token';
import { formatDateTime, relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

function TokensContent() {
    const now = useNow(30_000);
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
            <SettingsCard
                title="API tokens"
                description="A program uses a token to create File Shares for you. You see the full secret only once, when you create it."
            >
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

                {account.tokens.length === 0 ? (
                    <p className="rounded-[20px] bg-sunken px-4 py-3 text-muted-foreground">
                        No tokens yet.
                    </p>
                ) : (
                    <ul className="grid gap-1.5">
                        {account.tokens.map((token) => (
                            <li
                                key={token.id}
                                className={cn(
                                    'rounded-[20px] bg-sunken py-3 pr-3 pl-4',
                                    token.revoked && 'opacity-70',
                                )}
                            >
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <span
                                                className={cn(
                                                    'font-bold break-all',
                                                    token.revoked &&
                                                        'text-muted-foreground line-through',
                                                )}
                                            >
                                                {token.name}
                                            </span>
                                            {token.revoked && (
                                                <span className="rounded-[10px] bg-destructive-soft px-2 py-0.5 text-[13px] font-bold text-destructive">
                                                    Revoked
                                                </span>
                                            )}
                                        </p>
                                        <p className="mt-0.5 text-[14px] text-muted-foreground">
                                            created{' '}
                                            {formatDateTime(token.createdAt)} ·{' '}
                                            {token.revoked
                                                ? 'revoked'
                                                : token.lastUsedAt
                                                  ? `last used ${relativeTime(token.lastUsedAt, now)}`
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
                                                                immediately.
                                                                Shares it
                                                                already created
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

                                {!token.revoked && (
                                    <p className="mt-2.5 mr-1 rounded-[12px] bg-background px-3 py-2 font-mono text-[13px] break-all">
                                        {token.justCreated &&
                                        hiddenSecrets.has(token.id)
                                            ? maskApiToken(token.secret)
                                            : token.secret}
                                    </p>
                                )}

                                {token.justCreated &&
                                    !hiddenSecrets.has(token.id) && (
                                        <div className="mt-2 mr-1 flex flex-wrap items-center gap-2 rounded-[16px] bg-warn-soft py-2 pr-2 pl-3">
                                            <p className="mr-auto text-[14px] font-bold text-lamp">
                                                Copy it now. Dōzobin will not
                                                show it again.
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
                                                    setHiddenSecrets(
                                                        (current) => {
                                                            const next =
                                                                new Set(
                                                                    current,
                                                                );
                                                            next.add(token.id);

                                                            return next;
                                                        },
                                                    )
                                                }
                                            >
                                                Hide
                                            </Button>
                                        </div>
                                    )}
                            </li>
                        ))}
                    </ul>
                )}
            </SettingsCard>
            {dialog}
        </>
    );
}

export default function TokensPage() {
    return (
        <AppProviders>
            <SettingsLayout>
                <TokensContent />
            </SettingsLayout>
        </AppProviders>
    );
}
