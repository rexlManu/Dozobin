import { router, usePage } from '@inertiajs/react';
import { ArrowRight, Plus, QrCode, WarningCircle } from '@phosphor-icons/react';
import { BrowserQRCodeReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppProviders } from '@/components/app-providers';
import { AppShell } from '@/components/app-shell';
import { Dozo } from '@/components/dozo';
import { Countdown } from '@/components/expiry';
import { NightSky } from '@/components/night-sky';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useNow } from '@/hooks/use-now';
import { Link } from '@/lib/navigation';
import { isTransferExpired, transferExpiresAt } from '@/lib/transfer-state';
import type { TransferSession } from '@/lib/types';
import type { SharedPageProps } from '@/types';

const ERROR_COPY = {
    invalid: 'No live session uses that code. Check it on the other device.',
    expired: 'That session tidied itself up, so everything in it is gone.',
} as const;

function ScanDialog({ onCode }: { onCode: (code: string) => void }) {
    const [open, setOpen] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!open || videoRef.current === null) {
            return;
        }

        const reader = new BrowserQRCodeReader();
        let controls: IScannerControls | null = null;
        let active = true;
        setCameraError(null);

        void reader
            .decodeFromConstraints(
                {
                    video: { facingMode: { ideal: 'environment' } },
                    audio: false,
                },
                videoRef.current,
                (result, _error, scannerControls) => {
                    controls = scannerControls;

                    if (!active || result === undefined) {
                        return;
                    }

                    const raw = result.getText().trim();
                    const routeCode = raw.match(
                        /\/transfer\/([a-z0-9]{8})(?:$|[/?#])/i,
                    )?.[1];
                    const code =
                        routeCode ?? (/^[a-z0-9]{8}$/i.test(raw) ? raw : null);

                    if (code !== null) {
                        scannerControls.stop();
                        setOpen(false);
                        onCode(code.toUpperCase());
                    }
                },
            )
            .then((scannerControls) => {
                controls = scannerControls;
            })
            .catch(() => {
                if (active) {
                    setCameraError(
                        'The camera could not be opened. Check its browser permission, or type the Access Code instead.',
                    );
                }
            });

        return () => {
            active = false;
            controls?.stop();
        };
    }, [onCode, open]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="lg">
                    <QrCode /> Scan QR
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[24rem]">
                <DialogHeader>
                    <DialogTitle>Scan a QR code</DialogTitle>
                    <DialogDescription>
                        Point the camera at a Dōzobin Transfer Session QR code.
                    </DialogDescription>
                </DialogHeader>
                <div className="relative aspect-square overflow-hidden rounded-[22px] bg-sunken">
                    <video
                        ref={videoRef}
                        muted
                        playsInline
                        className="size-full object-cover"
                        aria-label="QR code camera preview"
                    />
                    <div className="absolute inset-6 rounded-[18px] border-[2.5px] border-dashed border-lavender/60" />
                </div>
                {cameraError && (
                    <p className="text-[14px] font-bold text-destructive">
                        {cameraError}
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
}

function TransferLobbyRoute({
    transfer,
}: {
    transfer: TransferSession | null;
}) {
    const now = useNow(30_000);
    const windowMs =
        usePage<SharedPageProps>().props.config.transferWindowHours *
        60 *
        60 *
        1000;

    const [code, setCode] = useState('');
    const [error, setError] = useState<keyof typeof ERROR_COPY | null>(null);

    const attempt = useCallback((raw: string) => {
        const normalized = raw.trim().toUpperCase();
        setCode(normalized);
        router.post(
            '/transfers/join',
            { code: normalized },
            {
                onError: (errors) =>
                    setError(
                        errors.code?.toLowerCase().includes('expired')
                            ? 'expired'
                            : 'invalid',
                    ),
            },
        );
    }, []);

    const live =
        transfer &&
        !isTransferExpired(transfer, windowMs, now) &&
        !transfer.leftLocally;

    return (
        <AppShell overlay>
            <div className="relative h-[260px] overflow-hidden sm:h-[300px]">
                <NightSky />
                <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-b from-transparent to-background"
                />
                <div className="rail relative pt-[92px] sm:pt-[108px]">
                    <h1 className="max-w-[24ch] text-[32px] leading-[1.08] font-bold text-balance sm:text-[44px]">
                        Pass things between your own devices.
                    </h1>
                </div>
            </div>

            <div className="rail relative z-10 -mt-10 grid gap-5 pb-20 md:grid-cols-2">
                {live && (
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[22px] border-[1.5px] border-lavender/50 bg-lavender-soft px-4 py-3 md:col-span-2">
                        <Dozo size={40} mood="happy" />
                        <span className="font-bold">
                            A session is open on this device
                        </span>
                        <span className="font-mono tracking-[0.14em]">
                            {transfer.code}
                        </span>
                        <span className="text-[13px] text-muted-foreground">
                            <Countdown
                                target={transferExpiresAt(transfer, windowMs)}
                            />{' '}
                            left
                        </span>
                        <Button size="sm" className="ml-auto" asChild>
                            <Link to={`/transfer/${transfer.code}`}>
                                Open it <ArrowRight />
                            </Link>
                        </Button>
                    </p>
                )}

                <section className="grid content-start gap-3.5 rounded-[28px] border-[1.5px] border-border bg-card p-6 sm:p-7">
                    <h2 className="text-[24px] font-bold">Start here</h2>
                    <p className="text-muted-foreground">
                        Open a session on this device, then join it from your
                        phone with the QR code. No account. It tidies itself up{' '}
                        {windowMs / 3_600_000} hours after the last activity.
                    </p>
                    <Button
                        size="lg"
                        className="justify-self-start"
                        onClick={() => router.post('/transfers')}
                    >
                        <Plus weight="bold" /> Start a session
                    </Button>
                </section>

                <form
                    className="grid content-start gap-3.5 rounded-[28px] border-[1.5px] border-border bg-card p-6 sm:p-7"
                    onSubmit={(event) => {
                        event.preventDefault();
                        attempt(code);
                    }}
                >
                    <h2 className="text-[24px] font-bold">
                        <label htmlFor="access-code">Join one</label>
                    </h2>
                    <p className="text-muted-foreground">
                        Type the 8 letters and digits from the other device.
                    </p>
                    <Input
                        id="access-code"
                        value={code}
                        inputMode="text"
                        autoCapitalize="characters"
                        autoComplete="off"
                        spellCheck={false}
                        maxLength={8}
                        aria-invalid={error !== null}
                        aria-describedby={
                            error ? 'access-code-error' : undefined
                        }
                        placeholder="K7MQ2XPD"
                        className="h-14 w-full max-w-[19rem] text-center font-mono text-[24px] tracking-[0.3em] uppercase md:text-[24px]"
                        onChange={(event) => {
                            setCode(
                                event.target.value
                                    .toUpperCase()
                                    .replace(/[^A-Z0-9]/g, ''),
                            );
                            setError(null);
                        }}
                    />
                    {error && (
                        <p
                            id="access-code-error"
                            className="flex items-start gap-1.5 font-bold text-destructive"
                        >
                            <WarningCircle
                                weight="fill"
                                className="mt-0.5 size-4 shrink-0"
                            />
                            {ERROR_COPY[error]}
                        </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="submit"
                            variant="secondary"
                            size="lg"
                            disabled={code.length !== 8}
                        >
                            Join
                        </Button>
                        <ScanDialog onCode={attempt} />
                    </div>
                </form>
            </div>
        </AppShell>
    );
}

export default function TransferLobbyPage({
    transfer,
}: {
    transfer: TransferSession | null;
}) {
    return (
        <AppProviders>
            <TransferLobbyRoute transfer={transfer} />
        </AppProviders>
    );
}
