import { router, usePage } from '@inertiajs/react';
import { CheckCircle } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { AppProviders } from '@/components/app-providers';
import { SettingsCard, SettingsLayout } from '@/components/settings-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { initials } from '@/lib/format';
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
        <SettingsCard title="Profile">
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <Avatar className="size-16">
                        <AvatarImage src={account.avatarSrc} alt="" />
                        <AvatarFallback className="text-[20px]">
                            {initials(account.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
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
                        <span className="flex items-center gap-1.5 font-bold text-mint">
                            <CheckCircle weight="fill" className="size-4" />
                            Saved
                        </span>
                    )}
                </div>
            </div>
        </SettingsCard>
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
