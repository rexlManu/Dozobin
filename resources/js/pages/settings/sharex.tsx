import { usePage } from '@inertiajs/react';
import { DownloadSimple } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { AppProviders } from '@/components/app-providers';
import { CopyButton } from '@/components/copy-button';
import { SettingsLayout, SettingsPageHead } from '@/components/settings-layout';
import { Button } from '@/components/ui/button';
import { maskApiToken } from '@/lib/api-token';
import { downloadText } from '@/lib/download';
import type { SharedPageProps } from '@/types';

function SharexContent() {
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
    }, [account]);

    if (!account) {
        return null;
    }

    return (
        <>
            <SettingsPageHead
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

export default function SharexPage() {
    return (
        <AppProviders>
            <SettingsLayout>
                <SharexContent />
            </SettingsLayout>
        </AppProviders>
    );
}
