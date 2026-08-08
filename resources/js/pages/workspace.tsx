import { router, usePage } from '@inertiajs/react';
import { TextAlignLeft, UploadSimple } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { AppProviders } from '@/components/app-providers';
import { AppShell } from '@/components/app-shell';
import { DropCanvas } from '@/components/dropzone';
import { PasteComposer, PasteTruths } from '@/components/paste-composer';
import { ShareOptions } from '@/components/share-options';
import { Button } from '@/components/ui/button';
import { UploadQueue } from '@/components/upload-queue';
import { useUploadQueue } from '@/hooks/use-upload-queue';
import { resolvePaste } from '@/lib/detect';
import { formatBytes } from '@/lib/format';
import { Link } from '@/lib/navigation';
import type { Account, ExpirationKey, PasteType } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

type Mode = 'files' | 'paste';

function ModeSwitch({
    mode,
    onMode,
}: {
    mode: Mode;
    onMode: (mode: Mode) => void;
}) {
    const options: {
        id: Mode;
        label: string;
        icon: React.ComponentType<{ className?: string }>;
    }[] = [
        { id: 'files', label: 'Files', icon: UploadSimple },
        { id: 'paste', label: 'Paste', icon: TextAlignLeft },
    ];

    return (
        // Plain buttons rather than a tablist: an ARIA tablist promises arrow-key
        // navigation, and two buttons in the tab order is the honest behaviour here.
        // A segment, not underlined text, so it reads as a control rather than as a
        // third navigation destination next to Drop and Transfer.
        <div
            aria-label="What to share"
            className="inline-flex rounded-md bg-muted p-0.5"
        >
            {options.map((option) => (
                <button
                    key={option.id}
                    type="button"
                    aria-pressed={mode === option.id}
                    onClick={() => onMode(option.id)}
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[12.5px] font-medium transition-colors',
                        mode === option.id
                            ? 'bg-background text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.07)]'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    <option.icon className="size-3.5" />
                    {option.label}
                </button>
            ))}
        </div>
    );
}

function StorageMeter({ account }: { account: Account }) {
    const ratio = Math.min(1, account.storageUsed / account.storageLimit);
    const tight = ratio > 0.9;

    return (
        <Link
            to="/settings/storage"
            className="group flex items-center gap-2.5 rounded-md px-1 py-1 text-[12px] transition-colors hover:bg-muted"
        >
            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                <span
                    className={cn(
                        'block h-full rounded-full',
                        tight ? 'bg-destructive' : 'bg-primary',
                    )}
                    style={{ width: `${Math.max(3, ratio * 100)}%` }}
                />
            </span>
            <span
                className={cn(
                    'font-mono',
                    tight ? 'text-destructive' : 'text-muted-foreground',
                )}
            >
                {formatBytes(account.storageUsed)} /{' '}
                {formatBytes(account.storageLimit)}
            </span>
        </Link>
    );
}

function Blocked({ suspended }: { suspended: boolean }) {
    if (suspended) {
        return (
            <div className="flex h-full flex-col items-center justify-center bg-sunken px-6 text-center">
                <h2 className="text-lg font-medium tracking-[-0.015em]">
                    This account is suspended
                </h2>
                <p className="mx-auto mt-2 max-w-[46ch] text-[13.5px] leading-relaxed text-muted-foreground">
                    The administrator of this installation has paused it, so
                    nothing new can be shared. Everything already shared keeps
                    resolving until it expires.
                </p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col items-center justify-center bg-sunken px-6 text-center">
            <h2 className="text-lg font-medium tracking-[-0.015em]">
                This installation keeps sharing to Members
            </h2>
            <p className="mx-auto mt-2 max-w-[46ch] text-[13.5px] leading-relaxed text-muted-foreground">
                Guest sharing is switched off in the administrator settings.
                Transfer Sessions still work without an account.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button asChild>
                    <Link to="/signin">Sign in</Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link to="/transfer">Open a Transfer Session</Link>
                </Button>
            </div>
        </div>
    );
}

/**
 * The readout along the bottom of the canvas. Deliberately not a bar: no rule,
 * no fill, nothing to separate it from the surface. It sits on the canvas the
 * way a HUD sits on a viewfinder, so the window still reads as one surface.
 */
function Hud({
    truths,
    children,
}: {
    truths: React.ReactNode;
    children?: React.ReactNode;
}) {
    return (
        /*
      One row on a desktop, two stacked bands on a phone.
      `flex-1` resolves its basis to 0, so on a narrow viewport the readout was
      crushed to a 40px column that spilled 135px of wrapped text straight
      through the controls. Stacking below `sm` gives each band the full rail:
      the readout reads as a line again, and the acts land in the thumb zone
      just above the tab bar.
    */
        <div className="rail flex shrink-0 flex-col gap-2.5 py-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3">
            <div className="min-w-0 sm:flex-1">{truths}</div>
            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                {children}
            </div>
        </div>
    );
}

function WorkspaceRoute() {
    const [mode, setMode] = useState<Mode>('files');
    const [body, setBody] = useState('');
    const [typeOverride, setTypeOverride] = useState<PasteType | 'auto'>(
        'auto',
    );
    const [languageOverride, setLanguageOverride] = useState<string | null>(
        null,
    );
    const [pasteHint, setPasteHint] = useState<string | null>(null);
    const { auth, config } = usePage<SharedPageProps>().props;
    const account = auth.user;
    const isGuest = account === null;
    const allowed = isGuest
        ? config.guestExpirations
        : config.memberExpirations;
    const configuredDefault = isGuest
        ? config.guestDefaultExpiration
        : config.memberDefaultExpiration;
    const defaultExpiration =
        account && allowed.includes(account.defaultExpiration)
            ? account.defaultExpiration
            : configuredDefault;
    const uploads = useUploadQueue();
    const queued = uploads.queue.length;

    const [options, setOptions] = useState<{
        expiration: ExpirationKey;
        password: string | null;
    }>({
        expiration: defaultExpiration,
        password: null,
    });

    // The installation, not the page, decides which windows exist.
    const resolvedOptions = allowed.includes(options.expiration)
        ? options
        : { ...options, expiration: defaultExpiration };

    // A clipboard screenshot is the third way in, alongside the drag and the
    // picker. It listens on the window because that is where the paste lands.
    useEffect(() => {
        if (mode !== 'files') {
            return;
        }

        const onPaste = (event: ClipboardEvent) => {
            const target = event.target as HTMLElement | null;

            if (
                target &&
                (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')
            ) {
                return;
            }

            const files = Array.from(event.clipboardData?.files ?? []).filter(
                (f) => f.type.startsWith('image/'),
            );

            if (files.length === 0) {
                return;
            }

            event.preventDefault();
            const stamp = new Date()
                .toISOString()
                .replace(/[:.]/g, '-')
                .slice(0, 19);
            uploads.enqueue(
                files.map(
                    (file, index) =>
                        new File(
                            [file],
                            `screenshot-${stamp}${files.length > 1 ? `-${index + 1}` : ''}.png`,
                            {
                                type: file.type,
                            },
                        ),
                ),
            );
            setPasteHint(
                `Picked up ${files.length} image${files.length > 1 ? 's' : ''} from the clipboard`,
            );
            window.setTimeout(() => setPasteHint(null), 3000);
        };
        window.addEventListener('paste', onPaste);

        return () => window.removeEventListener('paste', onPaste);
    }, [mode, uploads]);

    const resolved = useMemo(
        () => resolvePaste(body, typeOverride, languageOverride),
        [body, typeOverride, languageOverride],
    );

    const suspended = account?.status === 'suspended';
    const blocked = suspended || (isGuest && !config.guestSharing);

    // A machine truth, so it belongs on the HUD next to the other ones. The Guest
    // note it used to sit beside now lives in the share settings, next to the
    // choice it qualifies.
    const meter = account ? <StorageMeter account={account} /> : null;

    const uploadTruths = useMemo(() => {
        // An allow-list is worth stating up front, because it is restrictive and you
        // cannot guess it. A block-list is not: it is a short tail of things nobody
        // shares anyway, and the upload already explains itself if one is refused.
        const allowedTypes =
            config.fileTypeMode === 'allow' ? config.fileTypeList : [];

        return [
            `Max ${config.maxUploadMb} MB per file`,
            allowedTypes.length > 0
                ? `Allowed: ${allowedTypes.map((e) => `.${e}`).join(' ')}`
                : null,
        ].filter((truth): truth is string => truth !== null);
    }, [config]);

    return (
        <AppShell
            surface="canvas"
            headerExtra={
                blocked ? undefined : (
                    <ModeSwitch
                        mode={mode}
                        onMode={(next) => {
                            setMode(next);
                        }}
                    />
                )
            }
        >
            {blocked ? (
                <Blocked suspended={suspended} />
            ) : mode === 'files' ? (
                <DropCanvas
                    onFiles={uploads.enqueue}
                    idle={queued === 0}
                    tray={
                        queued > 0 ? (
                            <UploadQueue
                                expiration={resolvedOptions.expiration}
                                password={resolvedOptions.password || null}
                                queue={uploads.queue}
                                shares={uploads.shares}
                                onStart={uploads.startUpload}
                                onRetry={uploads.retryUpload}
                                onRemove={uploads.removeUpload}
                                onClear={uploads.clearQueue}
                            />
                        ) : null
                    }
                    bar={
                        <Hud
                            truths={
                                <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] text-muted-foreground">
                                    {uploadTruths.map((truth, index) => (
                                        <span
                                            key={truth}
                                            className="flex items-center gap-2.5"
                                        >
                                            {index > 0 && (
                                                <span
                                                    aria-hidden
                                                    className="text-border-strong"
                                                >
                                                    ·
                                                </span>
                                            )}
                                            {truth}
                                        </span>
                                    ))}
                                    {/* The separator travels with the text it precedes, so a
                        wrap never strands a middot at the end of a line. */}
                                    <span className="flex items-center gap-2.5">
                                        <span
                                            aria-hidden
                                            className="text-border-strong"
                                        >
                                            ·
                                        </span>
                                        <span
                                            aria-live="polite"
                                            className={cn(
                                                pasteHint ? 'text-primary' : '',
                                            )}
                                        >
                                            {pasteHint ??
                                                'Ctrl+V pastes a screenshot'}
                                        </span>
                                    </span>
                                    {meter}
                                </span>
                            }
                        >
                            <ShareOptions
                                value={resolvedOptions}
                                onChange={setOptions}
                                allowed={allowed}
                                canProtect={
                                    !isGuest || config.guestPasswordProtection
                                }
                                isGuest={isGuest}
                            />
                        </Hud>
                    }
                />
            ) : (
                <div className="flex h-full flex-col">
                    <div className="min-h-0 flex-1">
                        <PasteComposer
                            body={body}
                            onBody={(value) => {
                                setBody(value);
                            }}
                            typeOverride={typeOverride}
                            onTypeOverride={setTypeOverride}
                            languageOverride={languageOverride}
                            onLanguageOverride={setLanguageOverride}
                            resolved={resolved}
                            dock={
                                <Hud
                                    truths={
                                        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                            <PasteTruths
                                                body={body}
                                                typeOverride={typeOverride}
                                                resolved={resolved}
                                            />
                                            {meter}
                                        </span>
                                    }
                                >
                                    <ShareOptions
                                        value={resolvedOptions}
                                        onChange={setOptions}
                                        allowed={allowed}
                                        canProtect={
                                            !isGuest ||
                                            config.guestPasswordProtection
                                        }
                                        isGuest={isGuest}
                                    />
                                    {/* Takes the rest of the row once the options wrap onto their
                      own line, so the act is never a small target on a phone. */}
                                    <Button
                                        className="max-sm:flex-1"
                                        disabled={body.trim().length === 0}
                                        onClick={() => {
                                            router.post('/shares/pastes', {
                                                body,
                                                paste_type: resolved.pasteType,
                                                language: resolved.language,
                                                expiration:
                                                    resolvedOptions.expiration,
                                                password:
                                                    resolvedOptions.password ||
                                                    null,
                                            });
                                        }}
                                    >
                                        Create paste
                                    </Button>
                                </Hud>
                            }
                        />
                    </div>
                </div>
            )}
        </AppShell>
    );
}

export default function WorkspacePage() {
    return (
        <AppProviders>
            <WorkspaceRoute />
        </AppProviders>
    );
}
