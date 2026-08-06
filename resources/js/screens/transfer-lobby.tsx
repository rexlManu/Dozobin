import { ArrowRight, QrCode, WarningCircle } from '@phosphor-icons/react';
import { BrowserQRCodeReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';
import { useEffect, useRef, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Countdown } from '@/components/expiry';
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
import { Label } from '@/components/ui/label';
import { Link, useNavigate } from '@/lib/navigation';
import { isTransferExpired, transferExpiresAt, useDozo } from '@/store/store';

const ERROR_COPY = {
    invalid:
        'No live session uses that code. Codes are eight characters, letters and digits.',
    expired:
        'That session ran out its twelve hours of quiet and everything in it was removed.',
} as const;

/**
 * Numbered on purpose: this is one flow spread across two devices, and the
 * order is the thing people were missing. Hairlines rather than three cards,
 * so it reads as one instruction plate.
 */
const STEPS = [
    {
        title: 'Create it here',
        body: 'You get a QR code and an eight-character Access Code. Nothing is published and no account is involved.',
    },
    {
        title: 'Open it over there',
        body: 'Scan the QR or type the code on the other device. Whatever joins becomes an equal participant, including this one.',
    },
    {
        title: 'Push things either way',
        body: 'Files, screenshots and text. Every joined device can add and delete, nobody can end it early, and it clears twelve hours after the last thing anyone does.',
    },
];

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
                <Button variant="outline">
                    <QrCode /> Scan instead
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[24rem]">
                <DialogHeader>
                    <DialogTitle>Scan a QR code</DialogTitle>
                    <DialogDescription>
                        Point the camera at a Dōzobin Transfer Session QR code.
                    </DialogDescription>
                </DialogHeader>
                <div className="border-border bg-sunken relative aspect-square overflow-hidden rounded-lg border">
                    <video
                        ref={videoRef}
                        muted
                        playsInline
                        className="size-full object-cover"
                        aria-label="QR code camera preview"
                    />
                    <div className="border-border-strong absolute inset-6 rounded-md border-2 border-dashed" />
                    <div className="bg-primary absolute inset-x-6 top-1/2 h-px" />
                </div>
                {cameraError && (
                    <p className="text-destructive text-[12.5px] leading-relaxed">
                        {cameraError}
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
}

export function TransferLobbyRoute() {
    const navigate = useNavigate();
    const createTransfer = useDozo((s) => s.createTransfer);
    const joinTransfer = useDozo((s) => s.joinTransfer);
    const transfer = useDozo((s) => s.transfer);
    const windowMs = useDozo((s) => s.transferWindowMs());

    const [code, setCode] = useState('');
    const [error, setError] = useState<keyof typeof ERROR_COPY | null>(null);

    const attempt = async (raw: string) => {
        const result = await joinTransfer(raw);

        if (result.ok) {
            navigate(`/transfer/${raw.trim().toUpperCase()}`);

            return;
        }

        setCode(raw.trim().toUpperCase());
        setError(result.reason ?? 'invalid');
    };

    const live =
        transfer &&
        !isTransferExpired(transfer, windowMs) &&
        !transfer.leftLocally;

    return (
        <AppShell>
            <div className="rail py-6 sm:py-9">
                <h1 className="text-xl font-medium tracking-[-0.02em]">
                    Transfer Session
                </h1>
                <p className="text-muted-foreground mt-2 max-w-[62ch] text-[13.5px] leading-relaxed">
                    A scratch space for moving things between your own devices.
                    No account, no Library, no permanent URLs. It clears itself
                    twelve hours after the last thing anyone does in it.
                </p>

                {live && (
                    <div className="border-primary/40 bg-primary-soft/40 mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-4 py-3">
                        <span className="text-[13px] font-medium">
                            A session is already open here
                        </span>
                        <span className="font-mono text-[13px] tracking-[0.14em]">
                            {transfer.code}
                        </span>
                        <span className="text-muted-foreground font-mono text-[12px]">
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
                    </div>
                )}

                {/* One object split by hairlines, not three cards: the gap-px over a
            border-coloured surface is the divider. */}
                <ol className="border-border bg-border mt-7 grid gap-px overflow-hidden rounded-lg border sm:grid-cols-3">
                    {STEPS.map((step, index) => (
                        <li
                            key={step.title}
                            className="bg-background flex flex-col gap-2 p-5"
                        >
                            <span className="text-muted-foreground font-mono text-[11px] tracking-[0.12em]">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <h2 className="text-[14px] font-medium tracking-[-0.01em]">
                                {step.title}
                            </h2>
                            <p className="text-muted-foreground text-[13px] leading-relaxed">
                                {step.body}
                            </p>
                        </li>
                    ))}
                </ol>

                <div className="mt-6">
                    <Button
                        size="lg"
                        onClick={async () => {
                            const session = await createTransfer();
                            navigate(`/transfer/${session.code}`);
                        }}
                    >
                        Create a session <ArrowRight />
                    </Button>
                </div>

                {/* Joining is the other end of the same flow, not a rival offer: if you
            are here to join, someone already handed you the code. */}
                <form
                    className="border-border mt-8 border-t pt-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void attempt(code);
                    }}
                >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex flex-col gap-2">
                            <Label
                                htmlFor="access-code"
                                className="text-[13px] font-normal"
                            >
                                Already have a code?
                            </Label>
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
                                className="h-11 w-full text-center font-mono text-base uppercase tracking-[0.28em] sm:w-[13.5rem]"
                                onChange={(event) => {
                                    setCode(
                                        event.target.value
                                            .toUpperCase()
                                            .replace(/[^A-Z0-9]/g, ''),
                                    );
                                    setError(null);
                                }}
                            />
                        </div>
                        <Button
                            type="submit"
                            variant="outline"
                            disabled={code.length !== 8}
                        >
                            Join session
                        </Button>
                        <ScanDialog onCode={attempt} />
                    </div>

                    {error && (
                        <p
                            id="access-code-error"
                            className="text-destructive mt-3 flex items-start gap-1.5 text-[12.5px]"
                        >
                            <WarningCircle
                                weight="fill"
                                className="mt-px size-3.5 shrink-0"
                            />
                            {ERROR_COPY[error]}
                        </p>
                    )}
                </form>
            </div>
        </AppShell>
    );
}
