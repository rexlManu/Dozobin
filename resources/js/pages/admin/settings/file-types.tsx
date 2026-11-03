import { Plus, X } from '@phosphor-icons/react';
import { useState } from 'react';
import { AdminCard, AdminLayout } from '@/components/admin-layout';
import {
    AdminSettingsLayout,
    AdminSettingsPageHead,
    useAdminSettings,
} from '@/components/admin-settings-layout';
import { AppProviders } from '@/components/app-providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminConfig } from '@/lib/types';
import { cn } from '@/lib/utils';

const MODES: [AdminConfig['fileTypeMode'], string][] = [
    ['block', 'Block these'],
    ['allow', 'Allow only these'],
];

function FileTypesContent() {
    const { draft, setDraft } = useAdminSettings();
    const [extension, setExtension] = useState('');

    return (
        <>
            <AdminSettingsPageHead
                title="File types"
                description="Block some extensions, or accept only the ones you name."
            />
            <AdminCard className="grid gap-5">
                <div
                    role="group"
                    aria-label="How the list works"
                    className="inline-flex gap-1 justify-self-start rounded-[16px] bg-sunken p-1"
                >
                    {MODES.map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            aria-pressed={draft.fileTypeMode === value}
                            onClick={() => setDraft({ fileTypeMode: value })}
                            className={cn(
                                'rounded-[12px] px-4 py-2 font-bold transition-colors',
                                draft.fileTypeMode === value
                                    ? 'bg-lavender text-night'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {draft.fileTypeList.length === 0 && (
                        <p className="text-muted-foreground">
                            {draft.fileTypeMode === 'block'
                                ? 'Nothing blocked. Every extension is accepted.'
                                : 'Nothing allowed yet, so every upload is refused.'}
                        </p>
                    )}
                    {draft.fileTypeList.map((ext) => (
                        <span
                            key={ext}
                            className="inline-flex items-center gap-1 rounded-[13px] bg-sunken py-1 pr-1 pl-3 font-mono text-[14px]"
                        >
                            .{ext}
                            <button
                                type="button"
                                aria-label={`Remove .${ext}`}
                                className="grid size-6 place-items-center rounded-[9px] text-muted-foreground transition-colors hover:bg-destructive-soft hover:text-destructive"
                                onClick={() =>
                                    setDraft({
                                        fileTypeList: draft.fileTypeList.filter(
                                            (e) => e !== ext,
                                        ),
                                    })
                                }
                            >
                                <X weight="bold" className="size-3.5" />
                            </button>
                        </span>
                    ))}
                </div>

                <form
                    className="flex flex-wrap items-center gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        const clean = extension
                            .trim()
                            .replace(/^\./, '')
                            .toLowerCase();

                        if (!clean || draft.fileTypeList.includes(clean)) {
                            return;
                        }

                        setDraft({
                            fileTypeList: [...draft.fileTypeList, clean],
                        });
                        setExtension('');
                    }}
                >
                    <Input
                        value={extension}
                        onChange={(event) => setExtension(event.target.value)}
                        placeholder="iso"
                        aria-label="Extension to add"
                        className="w-[9rem]"
                    />
                    <Button
                        type="submit"
                        variant="outline"
                        disabled={!extension.trim()}
                    >
                        <Plus /> Add
                    </Button>
                </form>
            </AdminCard>
        </>
    );
}

export default function FileTypesPage() {
    return (
        <AppProviders>
            <AdminLayout>
                <AdminSettingsLayout>
                    <FileTypesContent />
                </AdminSettingsLayout>
            </AdminLayout>
        </AppProviders>
    );
}
