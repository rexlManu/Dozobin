import { router, usePage } from '@inertiajs/react';
import {
    Copy,
    DownloadSimple,
    Link as LinkIcon,
    QrCode,
    SignOut,
    Trash,
} from '@phosphor-icons/react';
import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AppProviders } from '@/components/app-providers';
import { AppShell } from '@/components/app-shell';
import { useConfirm } from '@/components/confirm-dialog';
import { CopyButton } from '@/components/copy-button';
import { DOZO_COLORS, Dozo } from '@/components/dozo';
import { FileGlyph } from '@/components/file-glyph';
import { MiniSky, Sparkle } from '@/components/night-sky';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useNow } from '@/hooks/use-now';
import { useOrigin } from '@/hooks/use-origin';
import type { LiveStatus } from '@/hooks/use-transfer-live';
import { useTransferLive } from '@/hooks/use-transfer-live';
import { firstApiError, requestJson } from '@/lib/api';
import { downloadSource, downloadText } from '@/lib/download';
import { HOUR, MINUTE, formatBytes, relativeTime } from '@/lib/format';
import { Link } from '@/lib/navigation';
import { isTransferExpired, transferExpiresAt } from '@/lib/transfer-state';
import type { Participant, TransferItem, TransferSession } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

/** A centered note with Dozo, for the expired and left states. */
function SessionNote({
    mood,
    title,
    children,
}: {
    mood: 'sleep' | 'wow';
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="mx-auto grid w-full max-w-[32rem] justify-items-center gap-3 px-4 py-16 text-center sm:py-24">
            <Dozo size={110} mood={mood} />
            <h1 className="text-[28px] font-bold">{title}</h1>
            {children}
        </div>
    );
}

function clockTime(at: number): string {
    return new Date(at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function remainingText(ms: number): string {
    const hours = Math.floor(ms / HOUR);
    const minutes = Math.floor((ms % HOUR) / MINUTE);

    return hours > 0
        ? `${hours} h ${String(minutes).padStart(2, '0')} min left`
        : `${minutes} min left`;
}

/** The code, the QR and the two copy actions: everything a new device needs. */
function AddDevice({ code, joinUrl }: { code: string; joinUrl: string }) {
    return (
        <div className="grid gap-3 rounded-[22px] bg-linear-to-b from-night to-[#0b0a18] p-3.5">
            <span className="label-meta flex items-center gap-1.5">
                <QrCode className="size-4" /> Add a device
            </span>
            <div className="flex gap-1" aria-label={`Access Code ${code}`}>
                {code.split('').map((char, index) => (
                    <span
                        key={index}
                        aria-hidden
                        className={cn(
                            'grid h-[34px] w-[27px] place-items-center rounded-[9px] bg-foreground text-[18px] font-bold text-night',
                            index === 4 && 'ml-[5px]',
                        )}
                    >
                        {char}
                    </span>
                ))}
            </div>
            <div className="flex items-center gap-3">
                <span className="size-24 shrink-0 rounded-[16px] bg-white p-2">
                    {joinUrl.startsWith('http') && (
                        <QRCodeSVG
                            value={joinUrl}
                            size={80}
                            level="M"
                            bgColor="#ffffff"
                            fgColor="#120f2c"
                        />
                    )}
                </span>
                <span className="grid gap-1.5">
                    <CopyButton value={code} size="sm" label="Copy code" />
                    <CopyButton value={joinUrl} size="sm" label="Copy link">
                        <LinkIcon />
                    </CopyButton>
                </span>
            </div>
        </div>
    );
}

function Party({
    participants,
    colorOf,
    isOnline,
    status,
    expiresAt,
    windowMs,
    now,
    code,
    joinUrl,
    showCode,
    onToggleCode,
    onLeave,
}: {
    participants: Participant[];
    colorOf: (id: string) => string;
    isOnline: (participant: Participant) => boolean;
    status: LiveStatus;
    expiresAt: number;
    windowMs: number;
    now: number;
    code: string;
    joinUrl: string;
    showCode: boolean;
    onToggleCode: () => void;
    onLeave: () => void;
}) {
    const here = participants.filter(isOnline).length;
    const remaining = Math.max(0, expiresAt - now);

    return (
        <aside className="flex min-h-0 scrollbar-slim flex-col gap-3.5 overflow-auto rounded-[28px] border-[1.5px] border-border bg-card pb-4">
            <div className="relative h-24 shrink-0 overflow-hidden rounded-t-[26px]">
                <MiniSky />
                <p className="absolute bottom-2.5 left-4 grid leading-tight [text-shadow:0_1px_8px_#05061a]">
                    <b className="text-[18px]">
                        {here} of {participants.length} here
                    </b>
                    <span
                        className={cn(
                            'text-[13px] font-bold',
                            status === 'live' ? 'text-mint' : 'text-lamp',
                        )}
                    >
                        {status === 'live'
                            ? 'Live'
                            : status === 'connecting'
                              ? 'Connecting…'
                              : 'Updates every few seconds'}
                    </span>
                </p>
            </div>

            <ul
                className="grid gap-1.5 px-3"
                aria-label="Devices in this session"
            >
                {participants.map((participant) => {
                    const on = isOnline(participant);

                    return (
                        <li
                            key={participant.id}
                            className={cn(
                                'flex items-center gap-2.5 rounded-[20px] bg-sunken py-1.5 pr-3 pl-1.5',
                                !on && 'opacity-55',
                            )}
                        >
                            <Dozo
                                size={42}
                                body={colorOf(participant.id)}
                                mood={on ? 'calm' : 'sleep'}
                            />
                            <span className="grid min-w-0 flex-1 leading-snug">
                                <b className="truncate">
                                    {participant.label}
                                    {participant.self && (
                                        <small className="ml-1.5 font-medium text-muted-foreground">
                                            you
                                        </small>
                                    )}
                                </b>
                                <small className="text-[12.5px] text-muted-foreground">
                                    {on
                                        ? 'Here now'
                                        : participant.self
                                          ? 'Reconnecting…'
                                          : `Joined ${relativeTime(participant.joinedAt, now)}`}
                                </small>
                            </span>
                            {on && <Sparkle />}
                        </li>
                    );
                })}
            </ul>

            <div className="grid gap-1.5 px-4">
                <p className="flex items-baseline justify-between gap-2 text-[14px]">
                    <span>
                        Tidies up at{' '}
                        <b className="text-lamp">{clockTime(expiresAt)}</b>
                    </span>
                    <small className="text-[12.5px] text-muted-foreground">
                        {remainingText(remaining)}
                    </small>
                </p>
                <span className="block h-2.5 overflow-hidden rounded-full bg-sunken ring-[1.5px] ring-border ring-inset">
                    <span
                        className="block h-full rounded-full bg-linear-to-r from-lavender to-lamp"
                        style={{ width: `${(remaining / windowMs) * 100}%` }}
                    />
                </span>
            </div>

            <div className={cn('px-3', !showCode && 'max-lg:hidden')}>
                <AddDevice code={code} joinUrl={joinUrl} />
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-2 px-4">
                <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden"
                    onClick={onToggleCode}
                >
                    <QrCode /> {showCode ? 'Hide code' : 'Add a device'}
                </Button>
                <Button
                    variant="link"
                    size="sm"
                    className="px-0"
                    onClick={onLeave}
                >
                    <SignOut /> Leave on this device
                </Button>
            </div>
        </aside>
    );
}

function ItemPreview({
    item,
    onClose,
}: {
    item: TransferItem | null;
    onClose: () => void;
}) {
    const src = item?.demoSrc;

    return (
        <Dialog
            open={item !== null}
            onOpenChange={(open) => !open && onClose()}
        >
            <DialogContent className="max-w-[46rem] sm:max-w-[46rem]">
                <DialogHeader>
                    <DialogTitle className="break-all">
                        {item?.name}
                    </DialogTitle>
                </DialogHeader>
                {item?.kind === 'image' && src ? (
                    <img
                        src={src}
                        alt={item.name}
                        className="max-h-[70vh] w-full rounded-[18px] object-contain"
                    />
                ) : src && item?.mime === 'application/pdf' ? (
                    <iframe
                        src={src}
                        title={item.name}
                        className="h-[70vh] w-full rounded-[18px] bg-white"
                    />
                ) : null}
            </DialogContent>
        </Dialog>
    );
}

/** One Transfer Item as a dialogue line: a name tag in the sender's color, then the content. */
function ItemLine({
    item,
    sender,
    mine,
    color,
    fresh,
    now,
    onPreview,
    onDownload,
    onDelete,
}: {
    item: TransferItem;
    sender: string;
    mine: boolean;
    color: string;
    fresh: boolean;
    now: number;
    onPreview: () => void;
    onDownload: () => void;
    onDelete: () => void;
}) {
    const src = item.demoSrc;
    const canPreview =
        (item.kind === 'image' || item.mime === 'application/pdf') && src;

    const copy = async () => {
        if (item.kind === 'text' && item.body !== undefined) {
            await navigator.clipboard.writeText(item.body);
            toast('Text copied');

            return;
        }

        try {
            const blob = await (await fetch(src ?? '')).blob();
            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob }),
            ]);
            toast('Image copied');
        } catch {
            toast('This browser cannot copy images. Save it instead.');
        }
    };

    return (
        <li
            className="grid max-w-[640px] justify-items-start"
            data-item={item.id}
        >
            <span
                className="relative z-10 -mb-[11px] ml-4 rounded-[10px] px-3 py-0.5 text-[13px] font-bold text-night shadow-[0_0_0_3px_#000]"
                style={{ backgroundColor: color }}
            >
                {mine ? 'You' : sender}
            </span>
            <div
                className={cn(
                    'grid max-w-full min-w-0 gap-2.5 rounded-[22px] border-[1.5px] px-4 pt-[18px] pb-2.5',
                    mine
                        ? 'border-[#3a2846] bg-[#1b1226]'
                        : 'border-border bg-card',
                    fresh && !mine && 'dz-pop border-lavender',
                )}
            >
                {item.kind === 'text' ? (
                    <p className="text-[16px] [overflow-wrap:anywhere] break-words whitespace-pre-wrap">
                        {item.body}
                    </p>
                ) : item.kind === 'image' && src ? (
                    <>
                        <button
                            type="button"
                            onClick={onPreview}
                            className="block rounded-[16px]"
                            aria-label={`Show ${item.name} larger`}
                        >
                            <img
                                src={src}
                                alt={item.name}
                                className="block max-h-[300px] w-full max-w-[300px] rounded-[16px] object-cover"
                            />
                        </button>
                        <p className="font-bold [overflow-wrap:anywhere]">
                            {item.name}{' '}
                            <small className="font-medium text-muted-foreground">
                                {formatBytes(item.size)}
                            </small>
                        </p>
                    </>
                ) : (
                    <p className="flex items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-[16px_18px_14px_20px] bg-lavender text-night">
                            <FileGlyph
                                mime={item.mime}
                                filename={item.name}
                                className="size-5"
                            />
                        </span>
                        <span className="grid min-w-0">
                            <b className="[overflow-wrap:anywhere]">
                                {item.name}
                            </b>
                            <small className="text-[12.5px] text-muted-foreground">
                                {formatBytes(item.size)}
                            </small>
                        </span>
                    </p>
                )}
                <div className="flex flex-wrap items-center gap-1.5">
                    <small className="mr-auto pr-2 text-[12.5px] text-muted-foreground">
                        {relativeTime(item.addedAt, now)}
                    </small>
                    {canPreview && item.kind !== 'image' && (
                        <Button variant="outline" size="sm" onClick={onPreview}>
                            Open
                        </Button>
                    )}
                    {(item.kind === 'text' || item.kind === 'image') && (
                        <Button variant="outline" size="sm" onClick={copy}>
                            <Copy /> Copy
                        </Button>
                    )}
                    {item.kind !== 'text' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onDownload}
                        >
                            <DownloadSimple /> Save
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete for every device"
                        onClick={onDelete}
                    >
                        <Trash />
                    </Button>
                </div>
            </div>
        </li>
    );
}

function Compose({
    onSend,
    onAttach,
}: {
    onSend: (text: string) => Promise<void>;
    onAttach: () => void;
}) {
    const [text, setText] = useState('');
    const submit = async () => {
        const value = text.trim();

        if (value === '') {
            return;
        }

        await onSend(value);
        setText('');
    };

    return (
        <form
            className="relative mt-3 grid shrink-0 gap-1.5 rounded-[24px] border-[1.5px] border-border-strong bg-sunken px-4 pt-5 pb-2 shadow-[inset_0_0_0_4px_var(--sunken),inset_0_0_0_5.5px_var(--border)]"
            onSubmit={(event) => {
                event.preventDefault();
                void submit();
            }}
        >
            <span className="absolute -top-[13px] left-5 rounded-[10px] bg-primary px-3.5 py-0.5 text-[13px] font-bold text-primary-foreground shadow-[0_0_0_3px_#000]">
                You
            </span>
            <textarea
                rows={2}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void submit();
                    }
                }}
                placeholder="Write something…"
                aria-label="New Transfer Item"
                className="min-h-[30px] resize-none bg-transparent text-[16px] outline-none placeholder:text-muted-foreground sm:min-h-[50px]"
            />
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                <button
                    type="submit"
                    className="group inline-flex items-baseline gap-2 py-1.5 text-[16px] font-bold shadow-[inset_0_-3px_0_var(--primary)] disabled:opacity-50"
                >
                    <i
                        aria-hidden
                        className="text-[12px] text-primary not-italic"
                    >
                        ▶
                    </i>
                    Send
                </button>
                <button
                    type="button"
                    onClick={onAttach}
                    className="group inline-flex items-baseline gap-2 py-1.5 text-[16px] font-bold text-muted-foreground hover:text-foreground"
                >
                    <i
                        aria-hidden
                        className="text-[12px] text-primary not-italic opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                    >
                        ▶
                    </i>
                    Attach a file
                </button>
                <small className="ml-auto hidden text-[12px] text-muted-foreground sm:block">
                    Enter sends · Shift Enter adds a line
                </small>
            </div>
        </form>
    );
}

function TransferSessionRoute({
    transfer,
    realtime,
}: {
    transfer: TransferSession;
    realtime: string | null;
}) {
    const now = useNow(30_000);
    const windowMs =
        usePage<SharedPageProps>().props.config.transferWindowHours * HOUR;
    const { confirm, dialog } = useConfirm();
    const { status, online } = useTransferLive(transfer.code, realtime);
    const [preview, setPreview] = useState<TransferItem | null>(null);
    const [sending, setSending] = useState(0);
    const [showCode, setShowCode] = useState(transfer.participants.length <= 1);
    const fileInput = useRef<HTMLInputElement>(null);
    // Items on screen at first render stay still; anything that arrives later pops in once.
    const [initialIds] = useState(
        () => new Set(transfer.items.map((item) => item.id)),
    );
    const code = transfer.code;
    // The QR needs the absolute URL, which only the browser knows.
    const origin = useOrigin('');

    const refresh = () => router.reload({ only: ['transfer'] });

    const addFiles = useCallback(
        async (files: File[]) => {
            if (files.length === 0) {
                return;
            }

            setSending((count) => count + files.length);

            try {
                await Promise.all(
                    files.map((file) => {
                        const body = new FormData();
                        body.append('file', file);

                        return requestJson(`/transfers/${code}/items`, {
                            method: 'POST',
                            body,
                        });
                    }),
                );
            } catch (error) {
                toast(firstApiError(error));
            } finally {
                setSending((count) => count - files.length);
                router.reload({ only: ['transfer'] });
            }
        },
        [code],
    );

    // Files dropped anywhere on the page, and screenshots pasted, become items.
    useEffect(() => {
        const over = (event: DragEvent) => event.preventDefault();
        const drop = (event: DragEvent) => {
            event.preventDefault();
            void addFiles(Array.from(event.dataTransfer?.files ?? []));
        };
        const paste = (event: ClipboardEvent) => {
            const target = event.target as HTMLElement | null;

            if (
                target &&
                (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')
            ) {
                return;
            }

            const images = Array.from(event.clipboardData?.files ?? []).filter(
                (file) => file.type.startsWith('image/'),
            );

            if (images.length === 0) {
                return;
            }

            event.preventDefault();
            const stamp = new Date()
                .toISOString()
                .replace(/[:.]/g, '-')
                .slice(0, 19);
            void addFiles(
                images.map(
                    (file) =>
                        new File([file], `screenshot-${stamp}.png`, {
                            type: file.type,
                        }),
                ),
            );
        };
        window.addEventListener('dragover', over);
        window.addEventListener('drop', drop);
        window.addEventListener('paste', paste);

        return () => {
            window.removeEventListener('dragover', over);
            window.removeEventListener('drop', drop);
            window.removeEventListener('paste', paste);
        };
    }, [addFiles]);

    if (isTransferExpired(transfer, windowMs, now)) {
        return (
            <AppShell>
                <SessionNote mood="sleep" title="This session tidied itself up">
                    <p className="text-muted-foreground">
                        Nothing happened in it for {windowMs / HOUR} hours, so
                        every item was deleted. The code{' '}
                        <span className="font-mono">{code}</span> now points at
                        nothing.
                    </p>
                    <Button asChild className="mt-2">
                        <Link to="/transfer">Start a new session</Link>
                    </Button>
                </SessionNote>
            </AppShell>
        );
    }

    if (transfer.leftLocally) {
        return (
            <AppShell>
                <SessionNote mood="sleep" title="You left on this device">
                    <p className="text-muted-foreground">
                        The other devices can keep going. Leaving never ends a
                        session.
                    </p>
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                        <Button
                            onClick={() => router.visit(`/transfer/${code}`)}
                        >
                            Rejoin {code}
                        </Button>
                        <Button variant="outline" asChild>
                            <Link to="/transfer">Back to Transfer</Link>
                        </Button>
                    </div>
                </SessionNote>
            </AppShell>
        );
    }

    const joinUrl = `${origin}/transfer/${code}`;
    const colorOf = (id: string) =>
        DOZO_COLORS[
            Math.max(
                0,
                transfer.participants.findIndex(
                    (participant) => participant.id === id,
                ),
            ) % DOZO_COLORS.length
        ];
    const isOnline = (participant: Participant) =>
        participant.self ? status === 'live' : online.has(participant.id);
    const participants = transfer.participants.filter(
        (participant) => !participant.left,
    );
    const self = transfer.participants.find((participant) => participant.self);
    const items = [...transfer.items].sort((a, b) => b.addedAt - a.addedAt);

    const leave = async () => {
        const ok = await confirm({
            title: 'Leave on this device?',
            description:
                'The session keeps running for the other devices. You can rejoin with the same code.',
            confirmLabel: 'Leave',
            cancelLabel: 'Stay',
            tone: 'neutral',
        });

        if (ok) {
            router.delete(`/transfers/${code}/leave`);
        }
    };

    const remove = async (item: TransferItem) => {
        const ok = await confirm({
            title: 'Delete for every device?',
            description: `${item.kind === 'text' ? 'This text' : item.name} disappears from all devices in this session.`,
            confirmLabel: 'Delete',
        });

        if (!ok) {
            return;
        }

        try {
            await requestJson(`/transfers/${code}/items/${item.id}`, {
                method: 'DELETE',
            });
        } catch (error) {
            toast(firstApiError(error));
        }

        refresh();
    };

    const download = (item: TransferItem) => {
        if (item.kind === 'text' && item.body !== undefined) {
            downloadText(item.body, `${item.id}.txt`);
        } else {
            void downloadSource(item.demoSrc, item.name);
        }

        void requestJson(`/transfers/${code}/touch`, {
            method: 'POST',
            body: JSON.stringify({ note: `downloaded ${item.name}` }),
        });
    };

    return (
        <AppShell>
            <div className="rail-wide grid gap-4 pt-2 pb-6 lg:h-[calc(100dvh-64px)] lg:min-h-[600px] lg:grid-cols-[300px_minmax(0,1fr)] lg:pb-5">
                <Party
                    participants={participants}
                    colorOf={colorOf}
                    isOnline={isOnline}
                    status={status}
                    expiresAt={transferExpiresAt(transfer, windowMs)}
                    windowMs={windowMs}
                    now={now}
                    code={code}
                    joinUrl={joinUrl}
                    showCode={showCode}
                    onToggleCode={() => setShowCode((shown) => !shown)}
                    onLeave={leave}
                />

                <section
                    aria-label="Transfer Items"
                    className="flex min-h-[60dvh] min-w-0 flex-col lg:min-h-0"
                >
                    {status !== 'live' && realtime !== null && (
                        <p className="flex shrink-0 items-center gap-2.5 rounded-[18px] bg-sunken px-3 py-2 font-bold text-lamp">
                            <Dozo size={34} mood="sleep" />
                            Reconnecting. The page still updates every few
                            seconds.
                        </p>
                    )}

                    <ul
                        aria-live="polite"
                        className="flex min-h-0 flex-1 scrollbar-slim flex-col-reverse gap-4 overflow-auto [mask-image:linear-gradient(transparent,#000_28px)] px-1.5 pt-3.5 pb-1.5"
                    >
                        {sending > 0 && (
                            <li className="ml-4 text-[13px] font-bold text-lavender">
                                Sending {sending}{' '}
                                {sending === 1 ? 'file' : 'files'}…
                            </li>
                        )}
                        {items.map((item) => {
                            const sender = transfer.participants.find(
                                (participant) =>
                                    participant.id === item.addedBy,
                            );

                            return (
                                <ItemLine
                                    key={item.id}
                                    item={item}
                                    sender={
                                        sender?.label ?? 'A device that left'
                                    }
                                    mine={
                                        sender !== undefined &&
                                        sender.id === self?.id
                                    }
                                    color={colorOf(item.addedBy)}
                                    fresh={!initialIds.has(item.id)}
                                    now={now}
                                    onPreview={() => setPreview(item)}
                                    onDownload={() => download(item)}
                                    onDelete={() => void remove(item)}
                                />
                            );
                        })}
                        {items.length === 0 && sending === 0 && (
                            <li className="m-auto grid justify-items-center gap-2 py-10 text-center text-muted-foreground">
                                <Dozo size={72} mood="calm" />
                                <p className="max-w-[34ch]">
                                    Nothing here yet. Write something below,
                                    drop a file, or paste a screenshot. It shows
                                    up on every device at once.
                                </p>
                            </li>
                        )}
                    </ul>

                    <Compose
                        onAttach={() => fileInput.current?.click()}
                        onSend={async (body) => {
                            try {
                                await requestJson(`/transfers/${code}/items`, {
                                    method: 'POST',
                                    body: JSON.stringify({ body }),
                                });
                            } catch (error) {
                                toast(firstApiError(error));
                            }

                            refresh();
                        }}
                    />
                    <input
                        ref={fileInput}
                        type="file"
                        multiple
                        className="sr-only"
                        tabIndex={-1}
                        onChange={(event) => {
                            void addFiles(Array.from(event.target.files ?? []));
                            event.target.value = '';
                        }}
                    />
                </section>
            </div>

            <ItemPreview item={preview} onClose={() => setPreview(null)} />
            {dialog}
        </AppShell>
    );
}

export default function TransferSessionPage({
    transfer,
    realtime = null,
}: {
    transfer: TransferSession;
    realtime?: string | null;
}) {
    return (
        <AppProviders>
            <TransferSessionRoute transfer={transfer} realtime={realtime} />
        </AppProviders>
    );
}
