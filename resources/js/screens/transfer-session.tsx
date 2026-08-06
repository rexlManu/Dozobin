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
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
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
import { downloadSource, downloadText } from '@/lib/download';
import { formatBytes, relativeTime } from '@/lib/format';
import { Link, useNavigate, useParams } from '@/lib/navigation';
import type { TransferItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
    EXPIRED_CODE,
    isTransferExpired,
    transferExpiresAt,
    useDozo,
} from '@/store/store';

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
            <div className="border-border bg-card flex size-11 items-center justify-center rounded-lg border">
                {expired ? (
                    <Hourglass className="text-muted-foreground size-5" />
                ) : (
                    <Question className="text-muted-foreground size-5" />
                )}
            </div>
            <h1 className="mt-5 text-xl font-medium tracking-[-0.02em]">
                {expired
                    ? 'This session has expired'
                    : 'No session uses that code'}
            </h1>
            <p className="text-muted-foreground mt-2 text-[13.5px] leading-relaxed">
                {expired
                    ? 'Twelve hours passed with nothing happening in it, so every Transfer Item was removed. Access Codes are not reused, so this one now points at nothing.'
                    : 'Either the code was mistyped or the session it belonged to is long gone. Codes are eight characters, letters and digits.'}
            </p>
            <p className="text-muted-foreground mt-4 font-mono text-[12px] tracking-[0.14em]">
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
            <div className="border-border bg-card flex size-11 items-center justify-center rounded-lg border">
                <SignOut className="text-muted-foreground size-5" />
            </div>
            <h1 className="mt-5 text-xl font-medium tracking-[-0.02em]">
                You left on this device
            </h1>
            <p className="text-muted-foreground mt-2 text-[13.5px] leading-relaxed">
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
                    <DialogTitle className="break-all font-mono text-[13px]">
                        {item?.name}
                    </DialogTitle>
                </DialogHeader>
                {item?.kind === 'text' ? (
                    <pre className="scrollbar-slim border-border bg-sunken max-h-[26rem] overflow-auto whitespace-pre-wrap rounded-lg border px-4 py-3 font-mono text-[12.5px] leading-[1.65]">
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
                        className="border-border h-[26rem] w-full rounded-lg border"
                    />
                ) : (
                    <div className="border-border bg-sunken text-muted-foreground rounded-lg border px-4 py-10 text-center text-[13px]">
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
    actorLabel,
    onPreview,
    onDelete,
}: {
    item: TransferItem;
    actorLabel: string;
    onPreview: () => void;
    onDelete: () => void;
}) {
    const touchTransfer = useDozo((s) => s.touchTransfer);
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
                    className="border-border size-10 shrink-0 rounded-md border object-cover"
                />
            ) : (
                <span className="border-border bg-sunken text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md border">
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
                <p className="text-muted-foreground mt-0.5 font-mono text-[11px]">
                    {formatBytes(item.size)} · {actorLabel} ·{' '}
                    {relativeTime(item.addedAt)}
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

                        touchTransfer(`downloaded ${item.name}`);
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

export function TransferSessionRoute() {
    const { code = '' } = useParams();
    const navigate = useNavigate();
    const transfer = useDozo((s) => s.transfer);
    const windowMs = useDozo((s) => s.transferWindowMs());
    const joinTransfer = useDozo((s) => s.joinTransfer);
    const addTransferItems = useDozo((s) => s.addTransferItems);
    const deleteTransferItem = useDozo((s) => s.deleteTransferItem);
    const leaveTransfer = useDozo((s) => s.leaveTransfer);
    const touchTransfer = useDozo((s) => s.touchTransfer);
    const { confirm, dialog } = useConfirm();

    const [text, setText] = useState('');
    const [composing, setComposing] = useState(false);
    const [preview, setPreview] = useState<TransferItem | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const joined = useRef(false);

    const matches = transfer?.code === code;

    // Opening the session is itself activity, which is the rule the countdown lives by.
    useEffect(() => {
        if (matches) {
            touchTransfer();

            return;
        }

        if (joined.current) {
            return;
        }

        joined.current = true;
        joinTransfer(code);
    }, [code, matches, joinTransfer, touchTransfer]);

    const addFiles = (files: File[]) => {
        if (files.length === 0) {
            return;
        }

        addTransferItems(
            files.map((file) => ({
                kind: file.type.startsWith('image/')
                    ? ('image' as const)
                    : ('file' as const),
                name: file.name,
                mime: file.type || 'application/octet-stream',
                size: file.size,
                objectUrl: URL.createObjectURL(file),
                file,
            })),
        );
    };

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
            addTransferItems(
                images.map((file) => ({
                    kind: 'image' as const,
                    name: `screenshot-${stamp}.png`,
                    mime: file.type,
                    size: file.size,
                    objectUrl: URL.createObjectURL(file),
                    file,
                })),
            );
        };
        window.addEventListener('paste', onPaste);

        return () => window.removeEventListener('paste', onPaste);
    }, [addTransferItems]);

    if (!transfer || !matches) {
        const upper = code.toUpperCase();

        return (
            <AppShell>
                <DeadSession
                    code={upper}
                    reason={upper === EXPIRED_CODE ? 'expired' : 'unknown'}
                />
            </AppShell>
        );
    }

    if (isTransferExpired(transfer, windowMs)) {
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
                    onRejoin={() => joinTransfer(transfer.code)}
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
            leaveTransfer();
            navigate('/transfer');
        }
    };

    return (
        <AppShell>
            {/* One strip of session facts, on hairlines rather than in a stack of
          panels: what it is called, how long it has, and who is in it. */}
            <div className="border-border border-b">
                <div className="rail flex flex-wrap items-center gap-x-5 gap-y-2.5 py-3.5">
                    <div className="flex items-center gap-2">
                        <span className="label-mono">Code</span>
                        <span className="font-mono text-[15px] tabular-nums tracking-[0.16em]">
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
                        className="bg-border hidden h-5 w-px sm:block"
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
                        className="bg-border hidden h-5 w-px sm:block"
                    />

                    <div className="text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px]">
                        {transfer.participants.map((participant) => (
                            <span
                                key={participant.id}
                                className="flex items-center gap-1.5"
                            >
                                <span
                                    className={cn(
                                        participant.self &&
                                            'text-foreground font-medium',
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
                                    <div className="border-border flex justify-center rounded-lg border bg-white p-3">
                                        <QRCodeSVG
                                            value={joinUrl}
                                            size={168}
                                            level="M"
                                            bgColor="#ffffff"
                                            fgColor="#111318"
                                        />
                                    </div>
                                    <p className="text-muted-foreground mt-2.5 max-w-[20rem] text-center text-[11.5px] leading-relaxed">
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
                    <section className="border-border flex flex-col items-center gap-5 border-b pb-8 text-center">
                        <div className="border-border rounded-lg border bg-white p-3">
                            <QRCodeSVG
                                value={joinUrl}
                                size={176}
                                level="M"
                                bgColor="#ffffff"
                                fgColor="#111318"
                            />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <p className="font-mono text-[26px] tabular-nums tracking-[0.18em]">
                                {transfer.code}
                            </p>
                            <h2 className="text-[15px] font-medium">
                                Waiting for another device
                            </h2>
                            <p className="text-muted-foreground max-w-[46ch] text-[13px] leading-relaxed">
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
                        addFiles(Array.from(event.dataTransfer.files));
                    }}
                    className="border-border bg-sunken rounded-xl border px-4 py-4"
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
                    <p className="text-muted-foreground mt-2 font-mono text-[11px]">
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
                                className="bg-background min-h-[7rem] font-mono text-[13px]"
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
                                    onClick={() => {
                                        addTransferItems([
                                            {
                                                kind: 'text',
                                                name: 'Pasted text',
                                                mime: 'text/plain',
                                                size: new TextEncoder().encode(
                                                    text,
                                                ).length,
                                                body: text,
                                            },
                                        ]);
                                        setText('');
                                        setComposing(false);
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
                            addFiles(Array.from(event.target.files ?? []));
                            event.target.value = '';
                        }}
                    />
                </div>

                {/* While pairing, the QR above already says what to do next, so an
            empty list would only repeat it. */}
                {(transfer.items.length > 0 || !pairing) && (
                    <section className="border-border bg-card overflow-hidden rounded-xl border">
                        <header className="border-border flex items-center gap-3 border-b px-3 py-2.5 sm:px-4">
                            <h2 className="text-[13px] font-semibold">
                                {transfer.items.length}{' '}
                                {transfer.items.length === 1 ? 'item' : 'items'}
                            </h2>
                            <p className="text-muted-foreground font-mono text-[11px]">
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
                                <p className="text-muted-foreground mx-auto mt-1.5 max-w-[40ch] text-[13px] leading-relaxed">
                                    Add something from this device, or open the
                                    Access Code on another one and push it from
                                    there.
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-border divide-y">
                                {transfer.items.map((item) => (
                                    <ItemRow
                                        key={item.id}
                                        item={item}
                                        actorLabel={actorLabel(item.addedBy)}
                                        onPreview={() => setPreview(item)}
                                        onDelete={async () => {
                                            const ok = await confirm({
                                                title: 'Delete this item?',
                                                description: (
                                                    <>
                                                        <span className="text-foreground font-mono">
                                                            {item.name}
                                                        </span>{' '}
                                                        is removed for every
                                                        device in the session.
                                                    </>
                                                ),
                                                confirmLabel: 'Delete',
                                            });

                                            if (ok) {
                                                deleteTransferItem(item.id);
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
                        <ul className="border-border mt-2.5 flex flex-col gap-1.5 border-t pt-3">
                            {transfer.activity.slice(0, 6).map((entry) => (
                                <li
                                    key={entry.id}
                                    className="text-muted-foreground text-[12px] leading-relaxed"
                                >
                                    <span className="text-foreground">
                                        {entry.actor}
                                    </span>{' '}
                                    {entry.text}
                                    <span className="font-mono text-[10.5px]">
                                        {' '}
                                        · {relativeTime(entry.at)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-muted-foreground mt-3 text-[11.5px] leading-relaxed">
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
