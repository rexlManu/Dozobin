import { FileDashed, Play } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { FileGlyph } from '@/components/file-glyph';
import { previewKind } from '@/lib/detect';
import { formatBytes } from '@/lib/format';
import type { FileShare } from '@/lib/types';

function Frame({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`border-border bg-sunken overflow-hidden rounded-xl border ${className}`}
        >
            {children}
        </div>
    );
}

/** Shown when a seeded sample has no bytes behind it. */
function NoBytesNote() {
    return (
        <p className="border-border bg-card text-muted-foreground border-t px-4 py-2.5 text-[12px] leading-relaxed">
            This is a seeded sample, so there is no file behind it. Drop a real
            file into the workspace to see this preview with actual content.
        </p>
    );
}

function TextPreview({ src }: { src: string }) {
    const [text, setText] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let active = true;
        fetch(src)
            .then((response) => response.text())
            .then((value) => active && setText(value.slice(0, 20_000)))
            .catch(() => active && setFailed(true));

        return () => {
            active = false;
        };
    }, [src]);

    if (failed) {
        return (
            <div className="text-muted-foreground px-4 py-6 text-[13px]">
                Could not read the file.
            </div>
        );
    }

    return (
        <pre className="scrollbar-slim max-h-[32rem] overflow-auto whitespace-pre-wrap px-4 py-4 font-mono text-[12.5px] leading-[1.65]">
            {text ?? 'Reading…'}
        </pre>
    );
}

export function FilePreview({ share }: { share: FileShare }) {
    const src = share.objectUrl ?? share.demoSrc;
    const kind = previewKind(share.mime, share.filename);
    const real = Boolean(share.objectUrl);

    if (!src || kind === 'none') {
        return (
            <Frame className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <FileDashed
                    weight="thin"
                    className="text-muted-foreground/60 size-14"
                />
                <p className="mt-4 text-[14px] font-medium">
                    No preview for this format
                </p>
                <p className="text-muted-foreground mt-1.5 max-w-[38ch] text-[13px] leading-relaxed">
                    Browsers cannot render{' '}
                    {share.filename.split('.').pop()?.toUpperCase() ?? 'this'}{' '}
                    files, so downloading is the way in.
                </p>
                <p className="border-border bg-card text-muted-foreground mt-4 inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 font-mono text-[11.5px]">
                    <FileGlyph
                        mime={share.mime}
                        filename={share.filename}
                        className="size-3.5"
                    />
                    {formatBytes(share.size)}
                </p>
            </Frame>
        );
    }

    if (kind === 'image') {
        return (
            <Frame>
                <img
                    src={src}
                    alt={share.filename}
                    className="max-h-[34rem] w-full bg-[repeating-conic-gradient(var(--muted)_0%_25%,transparent_0%_50%)] bg-[length:18px_18px] object-contain"
                />
            </Frame>
        );
    }

    if (kind === 'video') {
        if (!real) {
            return (
                <Frame>
                    <div className="relative">
                        <img
                            src={src}
                            alt=""
                            className="aspect-video w-full object-cover opacity-70"
                        />
                        <div className="absolute inset-0 grid place-items-center">
                            <span className="border-border-strong bg-background/85 flex size-14 items-center justify-center rounded-full border backdrop-blur-sm">
                                <Play weight="fill" className="size-5" />
                            </span>
                        </div>
                    </div>
                    <NoBytesNote />
                </Frame>
            );
        }

        return (
            <Frame>
                <video
                    src={src}
                    controls
                    className="max-h-[34rem] w-full bg-black"
                />
            </Frame>
        );
    }

    if (kind === 'audio') {
        return (
            <Frame className="px-4 py-5 sm:px-6 sm:py-6">
                <p className="text-muted-foreground mb-3 font-mono text-[11.5px]">
                    {share.filename}
                </p>
                <audio src={src} controls className="w-full" />
            </Frame>
        );
    }

    if (kind === 'pdf') {
        return (
            <Frame>
                <iframe
                    src={src}
                    title={share.filename}
                    className="bg-background h-[34rem] w-full"
                />
            </Frame>
        );
    }

    return (
        <Frame>
            <TextPreview src={src} />
        </Frame>
    );
}
