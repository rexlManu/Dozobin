import { usePage } from '@inertiajs/react';
import { DownloadSimple } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { AppProviders } from '@/components/app-providers';
import { CopyButton } from '@/components/copy-button';
import { SettingsCard, SettingsLayout } from '@/components/settings-layout';
import { Button } from '@/components/ui/button';
import { useOrigin } from '@/hooks/use-origin';
import { maskApiToken } from '@/lib/api-token';
import { downloadText } from '@/lib/download';
import type { SharedPageProps } from '@/types';

function SharexContent() {
    const account = usePage<SharedPageProps>().props.auth.user;
    const origin = useOrigin();

    const sharexConfig = useMemo(() => {
        const token = account?.tokens.find((t) => !t.revoked);

        return JSON.stringify(
            {
                Version: '17.0.0',
                Name: 'Dozobin',
                DestinationType: 'ImageUploader, TextUploader, FileUploader',
                RequestMethod: 'POST',
                RequestURL: `${origin}/api/v1/shares`,
                Headers: {
                    Authorization: `Bearer ${token ? maskApiToken(token.secret) : '<api token>'}`,
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
    }, [account, origin]);

    if (!account) {
        return null;
    }

    return (
        <SettingsCard
            title="ShareX"
            description="ShareX uploads through the API with one of your tokens. Each upload becomes a regular File Share."
        >
            <div className="grid gap-2 rounded-[22px] bg-linear-to-b from-night to-[#0b0a18] p-2">
                <div className="flex flex-wrap items-center gap-2 py-1 pr-1 pl-4">
                    <p className="mr-auto font-mono text-[13px] text-muted-foreground">
                        dozobin.sxcu
                    </p>
                    <div className="flex gap-2">
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
                </div>
                <pre className="scrollbar-slim overflow-x-auto rounded-[16px] bg-background/40 px-4 py-3.5 font-mono text-[13px] leading-[1.7]">
                    {sharexConfig}
                </pre>
            </div>
            <p className="text-[14px] text-muted-foreground">
                The token is masked here. Put a real token in the Authorization
                header before you import the file.
            </p>
        </SettingsCard>
    );
}

export default function SharexPage() {
    return (
        <AppProviders>
            <SettingsLayout>
                <SharexContent />
            </SettingsLayout>
        </AppProviders>
    );
}
