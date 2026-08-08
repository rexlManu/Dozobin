import { router, usePage } from '@inertiajs/react';
import { Plus } from '@phosphor-icons/react';
import { useState } from 'react';
import { AppProviders } from '@/components/app-providers';
import { useConfirm } from '@/components/confirm-dialog';
import { CopyButton } from '@/components/copy-button';
import { SettingsLayout, SettingsPageHead } from '@/components/settings-layout';
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
            <SettingsPageHead
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
                                          ? maskApiToken(token.secret)
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

export default function TokensPage() {
    return (
        <AppProviders>
            <SettingsLayout>
                <TokensContent />
            </SettingsLayout>
        </AppProviders>
    );
}
