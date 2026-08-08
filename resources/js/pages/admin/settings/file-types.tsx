import { Plus, X } from '@phosphor-icons/react';
import { useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import {
    AdminSettingsLayout,
    AdminSettingsPageHead,
    useAdminSettings,
} from '@/components/admin-settings-layout';
import { AppProviders } from '@/components/app-providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { AdminConfig } from '@/lib/types';

function FileTypesContent() {
    const { draft, setDraft } = useAdminSettings();
    const [extension, setExtension] = useState('');

    return (
        <>
            <AdminSettingsPageHead
                title="File types"
                description="Either name the extensions that are refused, or name the only ones accepted."
            />
            <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={draft.fileTypeMode}
                onValueChange={(value) =>
                    value &&
                    setDraft({
                        fileTypeMode: value as AdminConfig['fileTypeMode'],
                    })
                }
            >
                <ToggleGroupItem value="block">Block these</ToggleGroupItem>
                <ToggleGroupItem value="allow">
                    Allow only these
                </ToggleGroupItem>
            </ToggleGroup>

            <div className="flex flex-wrap gap-1.5">
                {draft.fileTypeList.length === 0 && (
                    <p className="text-[12.5px] text-muted-foreground">
                        {draft.fileTypeMode === 'block'
                            ? 'Nothing blocked. Every extension is accepted.'
                            : 'Nothing allowed yet, so every upload will be refused.'}
                    </p>
                )}
                {draft.fileTypeList.map((ext) => (
                    <span
                        key={ext}
                        className="inline-flex items-center gap-1 rounded-sm border border-border bg-sunken py-1 pr-1 pl-2 font-mono text-[11.5px]"
                    >
                        .{ext}
                        <button
                            type="button"
                            aria-label={`Remove .${ext}`}
                            className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            onClick={() =>
                                setDraft({
                                    fileTypeList: draft.fileTypeList.filter(
                                        (e) => e !== ext,
                                    ),
                                })
                            }
                        >
                            <X className="size-3" />
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

                    setDraft({ fileTypeList: [...draft.fileTypeList, clean] });
                    setExtension('');
                }}
            >
                <Input
                    value={extension}
                    onChange={(event) => setExtension(event.target.value)}
                    placeholder="iso"
                    aria-label="Extension to add"
                    className="w-[9rem] font-mono"
                />
                <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={!extension.trim()}
                >
                    <Plus /> Add
                </Button>
            </form>
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
