import { router, useForm, usePage } from '@inertiajs/react';
import { Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin-layout';
import { AppProviders } from '@/components/app-providers';
import { useConfirm } from '@/components/confirm-dialog';
import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/format';
import { Link } from '@/lib/navigation';
import type { InviteCode, InviteCodeStatus } from '@/lib/types';
import type { SharedPageProps } from '@/types';

interface InvitesPageProps extends SharedPageProps {
    invites: InviteCode[];
}

const STATUS_LABEL: Record<InviteCodeStatus, string> = {
    active: 'Active',
    expired: 'Expired',
    exhausted: 'Used up',
    revoked: 'Revoked',
};

function usageLabel(invite: InviteCode) {
    if (invite.maxUses === null) {
        return `${invite.uses} ${invite.uses === 1 ? 'use' : 'uses'}, no limit`;
    }

    return `${invite.uses} of ${invite.maxUses} used`;
}

function expiryLabel(invite: InviteCode) {
    return invite.expiresAt === null
        ? 'never expires'
        : `expires ${formatDateTime(invite.expiresAt)}`;
}

function InvitesContent() {
    const { config, invites } = usePage<InvitesPageProps>().props;
    const { confirm, dialog } = useConfirm();
    const registrationEnabled = config.registration === 'invite';
    const form = useForm({
        name: '',
        max_uses: '',
        expires_at: '',
    });

    return (
        <>
            <header>
                <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
                    Invite codes
                </h2>
                <p className="mt-1.5 max-w-[62ch] text-[13px] leading-relaxed text-muted-foreground">
                    Create registration links for specific people or groups.
                    Each link can stop after a set number of accounts, at a set
                    time, or when you revoke it.
                </p>
            </header>

            {!registrationEnabled && (
                <p className="border-y border-border py-3 text-[12.5px] leading-relaxed text-muted-foreground">
                    Registration is currently {config.registration}. Change it
                    to Invite only under{' '}
                    <Link
                        to="/admin/settings/access"
                        className="text-foreground underline decoration-border-strong underline-offset-4"
                    >
                        Access
                    </Link>{' '}
                    before sharing a link.
                </p>
            )}

            <form
                className="grid gap-4 border-b border-border pb-6 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_10rem_13rem_auto] lg:items-start"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.transform((data) => ({
                        ...data,
                        max_uses: data.max_uses || null,
                        expires_at: data.expires_at
                            ? new Date(data.expires_at).toISOString()
                            : null,
                    }));
                    form.post('/admin/invites', {
                        preserveScroll: true,
                        onSuccess: () => {
                            form.reset();
                            toast('Invite created');
                        },
                    });
                }}
            >
                <Field data-invalid={Boolean(form.errors.name)}>
                    <FieldLabel htmlFor="invite-name">Name</FieldLabel>
                    <Input
                        id="invite-name"
                        value={form.data.name}
                        placeholder="Who or what this is for"
                        aria-invalid={Boolean(form.errors.name)}
                        onChange={(event) =>
                            form.setData('name', event.target.value)
                        }
                    />
                    <FieldError>{form.errors.name}</FieldError>
                </Field>

                <Field data-invalid={Boolean(form.errors.max_uses)}>
                    <FieldLabel htmlFor="invite-max-uses">Use limit</FieldLabel>
                    <Input
                        id="invite-max-uses"
                        type="number"
                        min={1}
                        max={1_000_000}
                        inputMode="numeric"
                        value={form.data.max_uses}
                        placeholder="No limit"
                        aria-invalid={Boolean(form.errors.max_uses)}
                        onChange={(event) =>
                            form.setData('max_uses', event.target.value)
                        }
                    />
                    <FieldError>{form.errors.max_uses}</FieldError>
                </Field>

                <Field data-invalid={Boolean(form.errors.expires_at)}>
                    <FieldLabel htmlFor="invite-expires-at">Expires</FieldLabel>
                    <Input
                        id="invite-expires-at"
                        type="datetime-local"
                        value={form.data.expires_at}
                        aria-invalid={Boolean(form.errors.expires_at)}
                        onChange={(event) =>
                            form.setData('expires_at', event.target.value)
                        }
                    />
                    <FieldDescription>
                        Leave empty for no expiry.
                    </FieldDescription>
                    <FieldError>{form.errors.expires_at}</FieldError>
                </Field>

                <Button
                    type="submit"
                    className="sm:mt-6 sm:self-start"
                    disabled={!form.data.name.trim() || form.processing}
                >
                    <Plus /> Create invite
                </Button>
            </form>

            {invites.length === 0 ? (
                <p className="border-b border-border py-7 text-[13px] text-muted-foreground">
                    No invite codes yet. Create one above when you are ready to
                    let someone register.
                </p>
            ) : (
                <ul className="divide-y divide-border border-y border-border">
                    {invites.map((invite) => {
                        const active = invite.status === 'active';

                        return (
                            <li key={invite.id} className="py-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                            <p className="text-[13.5px] font-medium">
                                                {invite.name}
                                            </p>
                                            <span
                                                className={
                                                    active
                                                        ? 'text-[12px] text-foreground'
                                                        : 'text-[12px] text-muted-foreground'
                                                }
                                            >
                                                {STATUS_LABEL[invite.status]}
                                            </span>
                                        </div>
                                        <p className="mt-1 font-mono text-[12px] break-all text-foreground">
                                            {invite.code}
                                        </p>
                                        <p className="mt-1 text-[11.5px] text-muted-foreground">
                                            {usageLabel(invite)} ·{' '}
                                            {expiryLabel(invite)} · created{' '}
                                            {formatDateTime(invite.createdAt)}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1.5">
                                        {active && registrationEnabled && (
                                            <CopyButton
                                                value={invite.shareUrl}
                                                size="sm"
                                                label="Copy link"
                                            />
                                        )}
                                        {active && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={async () => {
                                                    const ok = await confirm({
                                                        title: 'Revoke this invite?',
                                                        description: (
                                                            <>
                                                                The link for{' '}
                                                                <span className="text-foreground">
                                                                    {
                                                                        invite.name
                                                                    }
                                                                </span>{' '}
                                                                will stop
                                                                accepting
                                                                registrations.
                                                                Accounts already
                                                                created with it
                                                                stay active.
                                                            </>
                                                        ),
                                                        confirmLabel: 'Revoke',
                                                    });

                                                    if (ok) {
                                                        router.delete(
                                                            `/admin/invites/${invite.id}`,
                                                            {
                                                                preserveScroll: true,
                                                                onSuccess: () =>
                                                                    toast(
                                                                        'Invite revoked',
                                                                    ),
                                                            },
                                                        );
                                                    }
                                                }}
                                            >
                                                Revoke
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
            {dialog}
        </>
    );
}

export default function InvitesPage() {
    return (
        <AppProviders>
            <AdminLayout>
                <InvitesContent />
            </AdminLayout>
        </AppProviders>
    );
}
