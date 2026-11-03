import { router, usePage } from '@inertiajs/react';
import { TextAlignLeft, UploadSimple } from '@phosphor-icons/react';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
} from 'react';
import { AppProviders } from '@/components/app-providers';
import { AppShell } from '@/components/app-shell';
import { Dozo } from '@/components/dozo';
import { DropZone } from '@/components/dropzone';
import { NightSky } from '@/components/night-sky';
import { PasteComposer, PasteTruths } from '@/components/paste-composer';
import { ShareOptions } from '@/components/share-options';
import { Button } from '@/components/ui/button';
import { UploadQueue } from '@/components/upload-queue';
import { useUploadQueue } from '@/hooks/use-upload-queue';
import { LANGUAGES, resolvePaste } from '@/lib/detect';
import { formatBytes } from '@/lib/format';
import { Link } from '@/lib/navigation';
import type { Account, ExpirationKey, PasteType } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { SharedPageProps } from '@/types';

type Mode = 'files' | 'paste';

const noSubscription = () => () => {};

function localGreeting(): string {
    const hour = new Date().getHours();

    return hour < 5
        ? 'Still up?'
        : hour < 11
          ? 'Good morning.'
          : hour < 17
            ? 'Good afternoon.'
            : hour < 22
              ? 'Good evening.'
              : 'Still up?';
}

/** Greeting for the visitor's local hour. The server render says "Hello." so hydration matches. */
function useGreeting(): string {
    return useSyncExternalStore(noSubscription, localGreeting, () => 'Hello.');
}

function ModeSwitch({
    mode,
    onMode,
}: {
    mode: Mode;
    onMode: (mode: Mode) => void;
}) {
    const options = [
        { id: 'files', label: 'Files', icon: UploadSimple },
        { id: 'paste', label: 'Text', icon: TextAlignLeft },
    ] as const;

    return (
        <div
            aria-label="What to share"
            className="inline-flex gap-1 justify-self-start rounded-[16px] bg-sunken p-1"
        >
            {options.map((option) => (
                <button
                    key={option.id}
                    type="button"
                    aria-pressed={mode === option.id}
                    onClick={() => onMode(option.id)}
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-[12px] px-4 py-2 font-bold transition-colors',
                        mode === option.id
                            ? 'bg-lavender text-night'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    <option.icon className="size-4" />
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
            className="inline-flex items-center gap-2 hover:text-foreground"
        >
            <span className="h-2 w-20 overflow-hidden rounded-full bg-sunken">
                <span
                    className={cn(
                        'block h-full rounded-full',
                        tight ? 'bg-destructive' : 'bg-lamp',
                    )}
                    style={{ width: `${Math.max(3, ratio * 100)}%` }}
                />
            </span>
            <span className={cn(tight && 'text-destructive')}>
                {formatBytes(account.storageUsed)} of{' '}
                {formatBytes(account.storageLimit)}
            </span>
        </Link>
    );
}

function Blocked({ suspended }: { suspended: boolean }) {
    return (
        <section className="relative grid justify-items-center gap-3 rounded-[28px] border-[1.5px] border-border bg-card px-6 py-10 text-center">
            <Dozo size={96} mood="sleep" />
            <h2 className="text-[24px] font-bold">
                {suspended
                    ? 'This account is paused'
                    : 'Sharing here is for Members'}
            </h2>
            <p className="max-w-[46ch] text-muted-foreground">
                {suspended
                    ? 'The administrator paused this account, so nothing new can be shared. Your existing shares keep working until they expire.'
                    : 'The administrator turned off sharing for Guests. Transfer Sessions still work without an account.'}
            </p>
            {!suspended && (
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                    <Button asChild>
                        <Link to="/signin">Sign in</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link to="/transfer">Start a Transfer Session</Link>
                    </Button>
                </div>
            )}
        </section>
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
    const greeting = useGreeting();
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
    const waitingForPassword = resolvedOptions.password === '';
    const sendPassword = resolvedOptions.password || null;

    // Files start uploading as soon as they land. The one exception: a password
    // was switched on but not typed yet, so the rows wait for "Send N files".
    const started = useRef(new Set<string>());
    const { queue, startUpload } = uploads;

    useEffect(() => {
        if (waitingForPassword) {
            return;
        }

        for (const item of queue) {
            if (item.status === 'queued' && !started.current.has(item.id)) {
                started.current.add(item.id);
                startUpload(item.id, resolvedOptions.expiration, sendPassword);
            }
        }
    }, [
        queue,
        startUpload,
        waitingForPassword,
        resolvedOptions.expiration,
        sendPassword,
    ]);

    // A clipboard screenshot is the third way in, next to the drag and the picker.
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
                (file) => file.type.startsWith('image/'),
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
                `Got ${files.length} image${files.length > 1 ? 's' : ''} from the clipboard`,
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
    const detected =
        resolved.pasteType === 'code'
            ? (LANGUAGES.find((language) => language.id === resolved.language)
                  ?.label ?? 'code')
            : resolved.pasteType === 'markdown'
              ? 'Markdown'
              : 'plain text';

    const suspended = account?.status === 'suspended';
    const blocked = suspended || (isGuest && !config.guestSharing);
    const allowedTypes =
        config.fileTypeMode === 'allow' ? config.fileTypeList : [];

    return (
        <AppShell overlay>
            <div className="relative h-[300px] overflow-hidden sm:h-[340px]">
                <NightSky />
                <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-b from-transparent to-background"
                />
                <div className="rail relative pt-[92px] sm:pt-[108px]">
                    <p className="font-bold text-lamp">
                        <span lang="ja" className="mr-1.5 text-primary">
                            どうぞ
                        </span>
                        {greeting}
                    </p>
                    <h1 className="mt-1.5 max-w-[16ch] text-[34px] leading-[1.08] font-bold text-balance sm:text-[clamp(34px,4.6vw,58px)]">
                        What are we sending today?
                    </h1>
                </div>
            </div>

            <div className="rail relative z-10 -mt-16 pb-20">
                {blocked ? (
                    <Blocked suspended={suspended} />
                ) : (
                    <>
                        <section className="relative grid gap-[18px] rounded-[28px] border-[1.5px] border-border bg-card p-[18px] pt-[22px] sm:p-[26px] sm:pt-[22px]">
                            <div
                                aria-hidden
                                className="absolute -top-[70px] right-4 flex flex-row-reverse items-end gap-2.5 sm:-top-[78px] sm:right-10"
                            >
                                <Dozo
                                    size={92}
                                    mood={mode === 'files' ? 'calm' : 'happy'}
                                />
                                <span className="mb-[52px] hidden rounded-[18px_18px_4px_18px] bg-foreground px-3.5 py-2 text-[14px] font-bold whitespace-nowrap text-night sm:block">
                                    {mode === 'files'
                                        ? 'Every file gets its own link.'
                                        : `Looks like ${detected}.`}
                                </span>
                            </div>

                            <ModeSwitch mode={mode} onMode={setMode} />

                            {mode === 'files' ? (
                                <DropZone
                                    onFiles={uploads.enqueue}
                                    hint={
                                        <span
                                            aria-live="polite"
                                            className={cn(
                                                pasteHint &&
                                                    'font-bold text-lamp',
                                            )}
                                        >
                                            {pasteHint ??
                                                [
                                                    'Ctrl V pastes a screenshot',
                                                    `up to ${config.maxUploadMb} MB each`,
                                                    allowedTypes.length > 0
                                                        ? `only ${allowedTypes.map((ext) => `.${ext}`).join(' ')}`
                                                        : null,
                                                    config.malwareScanningEnabled
                                                        ? 'scanned for malware'
                                                        : null,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                        </span>
                                    }
                                />
                            ) : (
                                <PasteComposer
                                    body={body}
                                    onBody={setBody}
                                    typeOverride={typeOverride}
                                    onTypeOverride={setTypeOverride}
                                    languageOverride={languageOverride}
                                    onLanguageOverride={setLanguageOverride}
                                    resolved={resolved}
                                    dock={
                                        <div className="flex flex-wrap items-center gap-3 px-5 pt-1 pb-4">
                                            <PasteTruths
                                                body={body}
                                                typeOverride={typeOverride}
                                                resolved={resolved}
                                            />
                                            <Button
                                                className="ml-auto max-sm:w-full"
                                                disabled={
                                                    body.trim().length === 0 ||
                                                    waitingForPassword
                                                }
                                                onClick={() => {
                                                    router.post(
                                                        '/shares/pastes',
                                                        {
                                                            body,
                                                            paste_type:
                                                                resolved.pasteType,
                                                            language:
                                                                resolved.language,
                                                            expiration:
                                                                resolvedOptions.expiration,
                                                            password:
                                                                sendPassword,
                                                        },
                                                    );
                                                }}
                                            >
                                                Create link
                                            </Button>
                                        </div>
                                    }
                                />
                            )}

                            <ShareOptions
                                value={resolvedOptions}
                                onChange={setOptions}
                                allowed={allowed}
                                known={config.memberExpirations}
                                canProtect={
                                    !isGuest || config.guestPasswordProtection
                                }
                            />

                            {(isGuest || account) && (
                                <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                                    {account ? (
                                        <StorageMeter account={account} />
                                    ) : (
                                        <span>
                                            Sending as a Guest.{' '}
                                            <Link
                                                to="/signin"
                                                className="font-bold text-foreground underline decoration-border-strong underline-offset-4"
                                            >
                                                Sign in
                                            </Link>{' '}
                                            to keep a Library.
                                        </span>
                                    )}
                                </p>
                            )}
                        </section>

                        <UploadQueue
                            expiration={resolvedOptions.expiration}
                            password={sendPassword}
                            queue={uploads.queue}
                            shares={uploads.shares}
                            onStart={uploads.startUpload}
                            onRetry={uploads.retryUpload}
                            onRemove={uploads.removeUpload}
                            onClear={uploads.clearQueue}
                        />
                    </>
                )}
            </div>
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
