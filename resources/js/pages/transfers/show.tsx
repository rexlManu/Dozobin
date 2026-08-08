import { router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Copy,
    DownloadSimple,
    Eye,
    FolderOpen,
    Hourglass,
    QrCode,
    Question,
    SignOut,
    TextAlignLeft,
    Trash,
} from '@phosphor-icons/react';
import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AppProviders } from '@/components/app-providers';
import { AppShell } from '@/components/app-shell';
import { useConfirm } from '@/components/confirm-dialog';
import { CopyButton } from '@/components/copy-button';
import { Countdown } from '@/components/expiry';
import { FileGlyph } from '@/components/file-glyph';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useNow } from '@/hooks/use-now';
import { requestJson } from '@/lib/api';
import { downloadSource, downloadText } from '@/lib/download';
import { formatBytes, relativeTime } from '@/lib/format';
import { Link } from '@/lib/navigation';
import { isTransferExpired, transferExpiresAt } from '@/lib/transfer-state';
import type { TransferItem, TransferSession } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

function DeadSession({
    code,
    reason,
}: {
    code: string;
    reason: 'expired' | 'unknown';
}) {
    const expired = reason === 'expired';

    return (
        <div className="mx-auto w-full max-w-[30rem] px-4 py-16 sm:py-24">
            <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-card">
                {expired ? (
                    <Hourglass className="size-5 text-muted-foreground" />
                ) : (
                    <Question className="size-5 text-muted-foreground" />
                )}
            </div>
            <h1 className="mt-5 text-xl font-medium tracking-[-0.02em]">
                {expired
                    ? 'This session has expired'
                    : 'No session uses that code'}
            </h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {expired
                    ? 'Twelve hours passed with nothing happening in it, so every Transfer Item was removed. Access Codes are not reused, so this one now points at nothing.'
                    : 'Either the code was mistyped or the session it belonged to is long gone. Codes are eight characters, letters and digits.'}
            </p>
            <p className="mt-4 font-mono text-[12px] tracking-[0.14em] text-muted-foreground">
                {code}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild>
                    <Link to="/transfer">Start a new session</Link>
                </Button>
            </div>
        </div>
    );
}

function LeftSession({
    code,
    onRejoin,
}: {
    code: string;
    onRejoin: () => void;
}) {
    return (
        <div className="mx-auto w-full max-w-[30rem] px-4 py-16 sm:py-24">
            <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-card">
                <SignOut className="size-5 text-muted-foreground" />
            </div>
            <h1 className="mt-5 text-xl font-medium tracking-[-0.02em]">
                You left on this device
            </h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                The session itself keeps running for the other devices in it.
                Leaving never ends a session, and neither does anything else a
                participant can do.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
                <Button onClick={onRejoin}>Rejoin {code}</Button>
                <Button variant="outline" asChild>
                    <Link to="/transfer">Back to Transfer</Link>
                </Button>
            </div>
        </div>
    );
}

function ItemPreview({
    item,
    onClose,
}: {
    item: TransferItem | null;
    onClose: () => void;
}) {
    const src = item?.objectUrl ?? item?.demoSrc;

    return (
        <Dialog
            open={item !== null}
            onOpenChange={(open) => !open && onClose()}
        >
            <DialogContent className="max-w-[46rem]">
                <DialogHeader>
                    <DialogTitle className="font-mono text-[13px] break-all">
                        {item?.name}
                    </DialogTitle>
                </DialogHeader>
                {item?.kind === 'text' ? (
                    <pre className="max-h-[26rem] scrollbar-slim overflow-auto rounded-lg border border-border bg-sunken px-4 py-3 font-mono text-[12.5px] leading-[1.65] whitespace-pre-wrap">
                        {item.body}
                    </pre>
                ) : item?.kind === 'image' && src ? (
                    <img
                        src={src}
                        alt={item.name}
                        className="max-h-[26rem] w-full rounded-lg object-contain"
                    />
                ) : src && item?.mime === 'application/pdf' ? (
                    <iframe
                        src={src}
                        title={item.name}
                        className="h-[26rem] w-full rounded-lg border border-border"
                    />
                ) : (
                    <div className="rounded-lg border border-border bg-sunken px-4 py-10 text-center text-[13px] text-muted-foreground">
                        No preview for this format. Download it on the device
                        that needs it.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function ItemRow({
    item,
    now,
    actorLabel,
    onPreview,
    onDelete,
    onTouch,
}: {
    item: TransferItem;
    now: number;
    actorLabel: string;
    onPreview: () => void;
    onDelete: () => void;
    onTouch: (note: string) => void;
}) {
    const src = item.objectUrl ?? item.demoSrc;

    const copy = async () => {
        if (item.kind === 'text' && item.body) {
            await navigator.clipboard.writeText(item.body);
            toast('Copied to the clipboard');

            return;
        }

        if (item.kind === 'image' && src) {
            try {
                const blob = await (await fetch(src)).blob();
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob }),
                ]);
                toast('Image copied to the clipboard');
            } catch {
                toast(
                    'This browser will not take an image from the clipboard API',
                    {
                        description:
                            'Download it instead, or right click the preview.',
                    },
                );
            }

            return;
        }

        toast('Only text and images can go on the clipboard', {
            description: 'Transfer Items have no public URL to copy either.',
        });
    };

    return (
        <li className="flex items-center gap-3 px-3 py-3 sm:px-4">
            {item.kind === 'image' && src ? (
                <img
                    src={src}
                    alt=""
                    className="size-10 shrink-0 rounded-md border border-border object-cover"
                />
            ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-sunken text-muted-foreground">
                    <FileGlyph
                        mime={item.mime}
                        filename={item.name}
                        className="size-[18px]"
                    />
                </span>
            )}

            <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium">
                    {item.name}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {formatBytes(item.size)} · {actorLabel} ·{' '}
                    {relativeTime(item.addedAt, now)}
                </p>
            </div>

            <div className="flex items-center gap-0.5">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Preview"
                    onClick={onPreview}
                >
                    <Eye />
                </Button>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Copy"
                    onClick={copy}
                >
                    <Copy />
                </Button>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Download"
                    onClick={() => {
                        if (item.kind === 'text' && item.body) {
                            downloadText(item.body, `${item.id}.txt`);
                        } else {
                            void downloadSource(src, item.name);
                        }

                        onTouch(`downloaded ${item.name}`);
                    }}
                >
                    <DownloadSimple />
                </Button>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete"
                    onClick={onDelete}
                >
                    <Trash />
                </Button>
            </div>
        </li>
    );
}

function TransferSessionRoute({ transfer }: { transfer: TransferSession }) {
    const now = useNow(30_000);
    const windowMs =
        usePage<SharedPageProps>().props.config.transferWindowHours *
        60 *
        60 *
        1000;
    const { confirm, dialog } = useConfirm();

    const [text, setText] = useState('');
    const [composing, setComposing] = useState(false);
    const [preview, setPreview] = useState<TransferItem | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const touchTransfer = (note = '') => {
        void requestJson(`/transfers/${transfer.code}/touch`, {
            method: 'POST',
            body: JSON.stringify({ note }),
        });
    };

    const addFiles = useCallback(
        async (files: File[]) => {
            if (files.length === 0) {
                return;
            }

            await Promise.all(
                files.map((file) => {
                    const body = new FormData();
                    body.append('file', file);

                    return requestJson(`/transfers/${transfer.code}/items`, {
                        method: 'POST',
                        body,
                    });
                }),
            );
            router.reload({ only: ['transfer'] });
        },
        [transfer.code],
    );

    useEffect(() => {
        const onPaste = (event: ClipboardEvent) => {
            const target = event.target as HTMLElement | null;

            if (
                target &&
                (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')
            ) {
                return;
            }

            const images = Array.from(event.clipboardData?.files ?? []).filter(
                (f) => f.type.startsWith('image/'),
            );

            if (images.length === 0) {
                return;
            }

            event.preventDefault();
            const stamp = new Date()
                .toISOString()
                .replace(/[:.]/g, '-')
                .slice(0, 19);
            const renamed = images.map(
                (file) =>
                    new File([file], `screenshot-${stamp}.png`, {
                        type: file.type,
                    }),
            );
            void addFiles(renamed);
        };
        window.addEventListener('paste', onPaste);

        return () => window.removeEventListener('paste', onPaste);
    }, [addFiles]);

    if (isTransferExpired(transfer, windowMs, now)) {
        return (
            <AppShell>
                <DeadSession code={transfer.code} reason="expired" />
            </AppShell>
        );
    }

    if (transfer.leftLocally) {
        return (
            <AppShell>
                <LeftSession
                    code={transfer.code}
                    onRejoin={() => router.visit(`/transfer/${transfer.code}`)}
                />
            </AppShell>
        );
    }

    const origin =
        typeof window === 'undefined'
            ? 'https://dozobin.example'
            : window.location.origin;
    const joinUrl = `${origin}/transfer/${transfer.code}`;
    const actorLabel = (id: string) =>
        transfer.participants.find((p) => p.id === id)?.label ??
        'A device that left';

    // Until another device is in and something has been staged, the whole job of
    // this page is handing the code over. After that the items are the job, and
    // the pairing collapses into the strip so it stops taking the good space.
    const pairing =
        transfer.participants.length <= 1 && transfer.items.length === 0;

    const leave = async () => {
        const ok = await confirm({
            title: 'Leave on this device?',
            description:
                'The session keeps running for the other devices and everything in it stays put. You can rejoin with the same Access Code.',
            confirmLabel: 'Leave',
            cancelLabel: 'Stay',
            tone: 'neutral',
        });

        if (ok) {
            router.delete(`/transfers/${transfer.code}/leave`);
        }
    };

    return (
        <AppShell>
            {/* One strip of session facts, on hairlines rather than in a stack of
          panels: what it is called, how long it has, and who is in it. */}
            <div className="border-b border-border">
                <div className="rail flex flex-wrap items-center gap-x-5 gap-y-2.5 py-3.5">
                    <div className="flex items-center gap-2">
                        <span className="label-mono">Code</span>
                        <span className="font-mono text-[15px] tracking-[0.16em] tabular-nums">
                            {transfer.code}
                        </span>
                        <CopyButton
                            value={transfer.code}
                            variant="ghost"
                            size="icon-sm"
                            label="Copy access code"
                        />
                    </div>

                    <span
                        aria-hidden
                        className="hidden h-5 w-px bg-border sm:block"
                    />

                    <div className="flex items-center gap-2">
                        <span className="label-mono">Clears in</span>
                        <Countdown
                            target={transferExpiresAt(transfer, windowMs)}
                            className="text-[14px]"
                        />
                    </div>

                    <span
                        aria-hidden
                        className="hidden h-5 w-px bg-border sm:block"
                    />

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-muted-foreground">
                        {transfer.participants.map((participant) => (
                            <span
                                key={participant.id}
                                className="flex items-center gap-1.5"
                            >
                                <span
                                    className={cn(
                                        participant.self &&
                                            'font-medium text-foreground',
                                    )}
                                >
                                    {participant.label}
                                </span>
                                <span className="font-mono text-[10.5px]">
                                    {participant.device}
                                </span>
                            </span>
                        ))}
                    </div>

                    <div className="ml-auto flex items-center gap-1.5">
                        {!pairing && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <QrCode /> Show QR
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-auto">
                                    <div className="flex justify-center rounded-lg border border-border bg-white p-3">
                                        <QRCodeSVG
                                            value={joinUrl}
                                            size={168}
                                            level="M"
                                            bgColor="#ffffff"
                                            fgColor="#111318"
                                        />
                                    </div>
                                    <p className="mt-2.5 max-w-[20rem] text-center text-[11.5px] leading-relaxed text-muted-foreground">
                                        Point another device at this, or type
                                        the code there.
                                    </p>
                                </PopoverContent>
                            </Popover>
                        )}
                        <Button variant="ghost" size="sm" onClick={leave}>
                            <SignOut /> Leave
                        </Button>
                    </div>
                </div>
            </div>

            <div className="rail flex flex-col gap-4 py-5 sm:py-6">
                {pairing && (
                    <section className="flex flex-col items-center gap-5 border-b border-border pb-8 text-center">
                        <div className="rounded-lg border border-border bg-white p-3">
                            <QRCodeSVG
                                value={joinUrl}
                                size={176}
                                level="M"
                                bgColor="#ffffff"
                                fgColor="#111318"
                            />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <p className="font-mono text-[26px] tracking-[0.18em] tabular-nums">
                                {transfer.code}
                            </p>
                            <h2 className="text-[15px] font-medium">
                                Waiting for another device
                            </h2>
                            <p className="max-w-[46ch] text-[13px] leading-relaxed text-muted-foreground">
                                Scan this or type the code over there. Every
                                device that joins gets the same rights as this
                                one, and nobody can end the session for the
                                others.
                            </p>
                        </div>
                    </section>
                )}

                <div
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                        event.preventDefault();
                        void addFiles(Array.from(event.dataTransfer.files));
                    }}
                    className="rounded-xl border border-border bg-sunken px-4 py-4"
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="mr-auto text-[13px] font-medium">
                            Add to this session
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => inputRef.current?.click()}
                        >
                            <FolderOpen /> Files
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setComposing((v) => !v)}
                        >
                            <TextAlignLeft /> Text
                        </Button>
                    </div>
                    <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                        Drop files here · Ctrl+V pastes a screenshot · items
                        never get a public URL
                    </p>

                    {composing && (
                        <div className="mt-3 flex flex-col gap-2">
                            <Textarea
                                autoFocus
                                value={text}
                                onChange={(event) =>
                                    setText(event.target.value)
                                }
                                placeholder="Type or paste anything the other device needs"
                                className="min-h-[7rem] bg-background font-mono text-[13px]"
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setComposing(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={text.trim().length === 0}
                                    onClick={async () => {
                                        await requestJson(
                                            `/transfers/${transfer.code}/items`,
                                            {
                                                method: 'POST',
                                                body: JSON.stringify({
                                                    body: text,
                                                }),
                                            },
                                        );
                                        setText('');
                                        setComposing(false);
                                        router.reload({ only: ['transfer'] });
                                    }}
                                >
                                    Add text <ArrowRight />
                                </Button>
                            </div>
                        </div>
                    )}

                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        className="sr-only"
                        onChange={(event) => {
                            void addFiles(Array.from(event.target.files ?? []));
                            event.target.value = '';
                        }}
                    />
                </div>

                {/* While pairing, the QR above already says what to do next, so an
            empty list would only repeat it. */}
                {(transfer.items.length > 0 || !pairing) && (
                    <section className="overflow-hidden rounded-xl border border-border bg-card">
                        <header className="flex items-center gap-3 border-b border-border px-3 py-2.5 sm:px-4">
                            <h2 className="text-[13px] font-semibold">
                                {transfer.items.length}{' '}
                                {transfer.items.length === 1 ? 'item' : 'items'}
                            </h2>
                            <p className="font-mono text-[11px] text-muted-foreground">
                                {formatBytes(
                                    transfer.items.reduce(
                                        (sum, item) => sum + item.size,
                                        0,
                                    ),
                                )}
                            </p>
                        </header>

                        {transfer.items.length === 0 ? (
                            <div className="px-6 py-14 text-center">
                                <p className="text-[14px] font-medium">
                                    Nothing here yet
                                </p>
                                <p className="mx-auto mt-1.5 max-w-[40ch] text-[13px] leading-relaxed text-muted-foreground">
                                    Add something from this device, or open the
                                    Access Code on another one and push it from
                                    there.
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-border">
                                {transfer.items.map((item) => (
                                    <ItemRow
                                        key={item.id}
                                        item={item}
                                        now={now}
                                        actorLabel={actorLabel(item.addedBy)}
                                        onPreview={() => setPreview(item)}
                                        onTouch={touchTransfer}
                                        onDelete={async () => {
                                            const ok = await confirm({
                                                title: 'Delete this item?',
                                                description: (
                                                    <>
                                                        <span className="font-mono text-foreground">
                                                            {item.name}
                                                        </span>{' '}
                                                        is removed for every
                                                        device in the session.
                                                    </>
                                                ),
                                                confirmLabel: 'Delete',
                                            });

                                            if (ok) {
                                                await requestJson(
                                                    `/transfers/${transfer.code}/items/${item.id}`,
                                                    { method: 'DELETE' },
                                                );
                                                router.reload({
                                                    only: ['transfer'],
                                                });
                                            }
                                        }}
                                    />
                                ))}
                            </ul>
                        )}
                    </section>
                )}

                {transfer.activity.length > 0 && (
                    <section className="mt-2">
                        <p className="label-mono">Recent activity</p>
                        <ul className="mt-2.5 flex flex-col gap-1.5 border-t border-border pt-3">
                            {transfer.activity.slice(0, 6).map((entry) => (
                                <li
                                    key={entry.id}
                                    className="text-[12px] leading-relaxed text-muted-foreground"
                                >
                                    <span className="text-foreground">
                                        {entry.actor}
                                    </span>{' '}
                                    {entry.text}
                                    <span className="font-mono text-[10.5px]">
                                        {' '}
                                        · {relativeTime(entry.at, now)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
                            The clock restarts whenever someone opens the
                            session, adds, downloads, or deletes something. A
                            tab left sitting open does not count.
                        </p>
                    </section>
                )}
            </div>

            <ItemPreview item={preview} onClose={() => setPreview(null)} />
            {dialog}
        </AppShell>
    );
}

export default function TransferSessionPage({
    transfer,
}: {
    transfer: TransferSession;
}) {
    return (
        <AppProviders>
            <TransferSessionRoute transfer={transfer} />
        </AppProviders>
    );
}
