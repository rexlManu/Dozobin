import { router, usePage } from '@inertiajs/react';
import { CheckCircle } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { AppProviders } from '@/components/app-providers';
import { SettingsLayout, SettingsPageHead } from '@/components/settings-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SharedPageProps } from '@/types';

function ProfileContent() {
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
            <SettingsPageHead title="Profile" />
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

export default function ProfilePage() {
    return (
        <AppProviders>
            <SettingsLayout>
                <ProfileContent />
            </SettingsLayout>
        </AppProviders>
    );
}
