import { router, usePage } from '@inertiajs/react';
import {
    Copy,
    DownloadSimple,
    Link as LinkIcon,
    PaperPlaneTilt,
    Paperclip,
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
import { Sparkle } from '@/components/night-sky';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useNow } from '@/hooks/use-now';
import { useOrigin } from '@/hooks/use-origin';
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

/** The QR code, the Access Code and two copy actions: everything a new device needs to join. */
function AddDevice({ code, joinUrl }: { code: string; joinUrl: string }) {
    return (
        <section
            aria-label="Add a device"
            className="grid gap-3 rounded-[22px] bg-sunken p-3"
        >
            <div className="flex items-center gap-3.5">
                <span className="grid size-[104px] shrink-0 place-items-center rounded-[16px] bg-white">
                    {joinUrl.startsWith('http') && (
                        <QRCodeSVG
                            value={joinUrl}
                            size={88}
                            level="M"
                            bgColor="#ffffff"
                            fgColor="#120f2c"
                        />
                    )}
                </span>
                <div className="grid min-w-0 gap-1.5">
                    <span className="label-meta">Add a device</span>
                    <span
                        aria-label={`Access Code ${code}`}
                        className="font-mono text-[22px] leading-none tracking-[0.08em] whitespace-nowrap"
                    >
                        {code.slice(0, 4)}
                        <span className="ml-[0.4em]">{code.slice(4)}</span>
                    </span>
                    <span className="text-[13px] leading-snug text-muted-foreground">
                        Scan it, or enter the code.
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <CopyButton value={code} size="sm" label="Copy code" />
                <CopyButton value={joinUrl} size="sm" label="Copy link">
                    <LinkIcon />
                </CopyButton>
            </div>
        </section>
    );
}

function Party({
    participants,
    colorOf,
    isOnline,
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
    expiresAt: number;
    windowMs: number;
    now: number;
    code: string;
    joinUrl: string;
    showCode: boolean;
    onToggleCode: () => void;
    onLeave: () => void;
}) {
    const remaining = Math.max(0, expiresAt - now);

    return (
        <aside className="flex min-h-0 scrollbar-slim flex-col gap-3.5 overflow-auto rounded-[28px] border-[1.5px] border-border bg-card pt-3 pb-4">
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

/** The message bar under the log: attach on the left, the text in the middle, Send on the right. */
function Compose({
    onSend,
    onAttach,
}: {
    /** Resolves true once the text is added; on false the text stays for another try. */
    onSend: (text: string) => Promise<boolean>;
    onAttach: () => void;
}) {
    const [text, setText] = useState('');
    const empty = text.trim() === '';
    const submit = async () => {
        if (empty) {
            return;
        }

        if (await onSend(text.trim())) {
            setText('');
        }
    };

    return (
        <div className="mt-3 grid shrink-0 gap-1.5">
            <form
                className="flex items-end gap-1.5 rounded-[24px] border-[1.5px] border-border bg-card p-1.5 transition-colors focus-within:border-lavender/70"
                onSubmit={(event) => {
                    event.preventDefault();
                    void submit();
                }}
            >
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Attach files"
                    className="rounded-[18px]"
                    onClick={onAttach}
                >
                    <Paperclip className="size-5" />
                </Button>
                <textarea
                    rows={1}
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
                    className="field-sizing-content max-h-40 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-[16px] leading-6 outline-none placeholder:text-muted-foreground"
                />
                <Button
                    type="submit"
                    disabled={empty}
                    className="rounded-[18px]"
                >
                    <PaperPlaneTilt weight="fill" /> Send
                </Button>
            </form>
            <p className="hidden px-4 text-[12px] text-muted-foreground sm:block">
                Enter sends, Shift Enter adds a line. Drop or paste files
                anywhere on the page.
            </p>
        </div>
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
    const expired = isTransferExpired(transfer, windowMs, now);
    const { status, online } = useTransferLive(
        transfer.code,
        realtime,
        !expired,
    );
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

    if (expired) {
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

    const here = participants.filter(isOnline).length;

    return (
        <AppShell
            head={
                <div className="grid gap-1.5">
                    <p className="flex flex-wrap items-center gap-x-2 font-bold">
                        <span
                            className={
                                status === 'live' ? 'text-mint' : 'text-lamp'
                            }
                        >
                            {status === 'live'
                                ? 'Live'
                                : status === 'connecting'
                                  ? 'Connecting…'
                                  : 'Updates every few seconds'}
                        </span>
                        <span aria-hidden className="text-muted-foreground">
                            ·
                        </span>
                        <span className="font-mono tracking-[0.08em]">
                            {code}
                        </span>
                    </p>
                    <h1 className="text-[32px] leading-tight font-bold sm:text-[44px]">
                        {here} of {participants.length}{' '}
                        {participants.length === 1 ? 'device' : 'devices'} here
                    </h1>
                </div>
            }
        >
            <div className="rail grid gap-4 pb-6 lg:h-[calc(100dvh-276px)] lg:min-h-[520px] lg:grid-cols-[300px_minmax(0,1fr)] lg:pb-5">
                <Party
                    participants={participants}
                    colorOf={colorOf}
                    isOnline={isOnline}
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

                                return false;
                            }

                            refresh();

                            return true;
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
