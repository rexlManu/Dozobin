import { ArrowRight } from '@phosphor-icons/react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from '@/lib/navigation';
import { ADMIN_ID, EXPIRED_CODE, MEMBER_ID, useDozo } from '@/store/store';

interface StateEntry {
    name: string;
    note: string;
    /** Either a link, or an action that arms the store and then navigates. */
    to?: string;
    action?: { label: string; run: () => void };
}

interface Group {
    title: string;
    entries: StateEntry[];
}

function Entry({ entry }: { entry: StateEntry }) {
    return (
        <li className="grid gap-2 py-3.5 sm:grid-cols-[13rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-4">
            <p className="text-[13.5px] font-medium">{entry.name}</p>
            <p className="text-muted-foreground text-[12.5px] leading-relaxed">
                {entry.note}
            </p>
            {entry.to ? (
                <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="justify-self-start sm:justify-self-end"
                >
                    <Link to={entry.to}>
                        Open <ArrowRight />
                    </Link>
                </Button>
            ) : entry.action ? (
                <Button
                    variant="outline"
                    size="sm"
                    className="justify-self-start sm:justify-self-end"
                    onClick={entry.action.run}
                >
                    {entry.action.label} <ArrowRight />
                </Button>
            ) : (
                <span />
            )}
        </li>
    );
}

export function StatesRoute() {
    const navigate = useNavigate();
    const setAccount = useDozo((s) => s.setAccount);
    const setUploadFault = useDozo((s) => s.setUploadFault);
    const fillStorage = useDozo((s) => s.fillStorage);
    const setAdminDraft = useDozo((s) => s.setAdminDraft);
    const saveAdmin = useDozo((s) => s.saveAdmin);
    const clearQueue = useDozo((s) => s.clearQueue);
    const deleteShares = useDozo((s) => s.deleteShares);
    const shares = useDozo((s) => s.shares);

    const go = (path: string) => navigate(path);

    const groups: Group[] = [
        {
            title: 'Workspace',
            entries: [
                {
                    name: 'Empty workspace',
                    note: 'The Drop Workspace with nothing queued. This is what opening Dōzobin gives you.',
                    action: {
                        label: 'Clear and open',
                        run: () => {
                            clearQueue();
                            go('/');
                        },
                    },
                },
                {
                    name: 'Populated Library',
                    note: 'Fifteen seeded shares across images, an archive, a PDF, plain text, Markdown, source code, and one broken record.',
                    action: {
                        label: 'Sign in and open',
                        run: () => {
                            setAccount(MEMBER_ID);
                            go('/library');
                        },
                    },
                },
                {
                    name: 'Empty Library',
                    note: 'What a Member sees before they have shared anything.',
                    action: {
                        label: 'Empty it and open',
                        run: () => {
                            setAccount(MEMBER_ID);
                            deleteShares(
                                shares
                                    .filter((s) => s.ownerId === MEMBER_ID)
                                    .map((s) => s.id),
                            );
                            go('/library');
                        },
                    },
                },
                {
                    name: 'Guest sharing switched off',
                    note: 'The administrator can stop signed-out visitors from creating shares.',
                    action: {
                        label: 'Switch off and open',
                        run: () => {
                            setAdminDraft({ guestSharing: false });
                            saveAdmin();
                            setAccount(null);
                            go('/');
                        },
                    },
                },
            ],
        },
        {
            title: 'Uploads',
            entries: [
                {
                    name: 'Uploading with progress',
                    note: 'Drop a few files and press upload. Each one carries its own bar and its own result.',
                    action: {
                        label: 'Open normal',
                        run: () => {
                            setUploadFault('none');
                            go('/');
                        },
                    },
                },
                {
                    name: 'Partially failed batch',
                    note: 'Every third file in the batch drops out partway through, leaving finished and failed rows side by side.',
                    action: {
                        label: 'Arm flaky and open',
                        run: () => {
                            setUploadFault('flaky');
                            go('/');
                        },
                    },
                },
                {
                    name: 'Offline or interrupted',
                    note: 'The whole attempt fails before any bytes move. Retry clears the fault so it can succeed.',
                    action: {
                        label: 'Arm offline and open',
                        run: () => {
                            setUploadFault('offline');
                            go('/');
                        },
                    },
                },
                {
                    name: 'Invalid file type',
                    note: 'Drop anything ending in .exe .msi .bat .cmd .scr or .jar while the installation blocks them.',
                    action: {
                        label: 'Open the workspace',
                        run: () => {
                            setUploadFault('none');
                            go('/');
                        },
                    },
                },
                {
                    name: 'Oversized file',
                    note: "Anything over the installation's 512 MB cap is refused before it starts. Lower the cap in the admin area to trip it with a small file.",
                    action: {
                        label: 'Set the cap to 1 MB',
                        run: () => {
                            setAdminDraft({ maxUploadMb: 1 });
                            saveAdmin();
                            setUploadFault('none');
                            go('/');
                        },
                    },
                },
                {
                    name: 'Storage quota reached',
                    note: 'A Member at the edge of their quota gets refused with a pointer at what to do about it.',
                    action: {
                        label: 'Fill storage and open',
                        run: () => {
                            setAccount(MEMBER_ID);
                            fillStorage();
                            setUploadFault('none');
                            go('/');
                        },
                    },
                },
            ],
        },
        {
            title: 'Public views',
            entries: [
                {
                    name: 'Image File Share',
                    note: 'Preview, metadata, download.',
                    to: '/s/q7m2xrk9pd',
                },
                {
                    name: 'PDF File Share',
                    note: "Rendered in the browser's own viewer.",
                    to: '/s/ah05rvyd3c',
                },
                {
                    name: 'Audio File Share',
                    note: 'Playable, with real generated audio behind it.',
                    to: '/s/dr58wgka1n',
                },
                {
                    name: 'Video File Share',
                    note: 'Poster frame and a note that the sample carries no bytes.',
                    to: '/s/bp29qtmc7h',
                },
                {
                    name: 'Archive, no preview',
                    note: 'Metadata and download as the clear next action.',
                    to: '/s/tz85nfhb3q',
                },
                {
                    name: 'Protected File Share',
                    note: 'Password challenge first. Wrong answers are shown inline.',
                    to: '/s/hs93kqdz2m',
                },
                {
                    name: 'Unavailable stored object',
                    note: 'The record exists but the file behind it does not.',
                    to: '/s/nq18ezpt6r',
                },
                {
                    name: 'Missing share',
                    note: 'A URL that never pointed at anything.',
                    to: '/s/does-not-exist',
                },
                {
                    name: 'Markdown Paste',
                    note: 'Rendered, with a raw view and a copy action.',
                    to: '/p/vn4bt8scwe',
                },
                {
                    name: 'Source code Paste',
                    note: 'Language-aware colouring, line numbers, wrapping.',
                    to: '/p/gx71ndzq5t',
                },
                {
                    name: 'Plain text Paste',
                    note: 'Stays plain. No colouring, no rendering.',
                    to: '/p/km37xdws9e',
                },
                {
                    name: 'Protected Paste',
                    note: 'Same challenge as a Protected File Share.',
                    to: '/p/ly62smvb0k',
                },
                {
                    name: 'Paste near expiry',
                    note: 'The countdown switches to seconds under two hours.',
                    to: '/p/wc61jrpx4a',
                },
            ],
        },
        {
            title: 'Transfer Sessions',
            entries: [
                {
                    name: 'Active session',
                    note: 'Access Code, QR, countdown, participants, items, activity.',
                    to: '/transfer/K7MQ2XPD',
                },
                {
                    name: 'Expired session',
                    note: 'Twelve quiet hours passed and every item went with it.',
                    to: `/transfer/${EXPIRED_CODE}`,
                },
                {
                    name: 'Invalid Access Code',
                    note: 'Eight characters that match no live session.',
                    to: '/transfer/ZZ00ZZ00',
                },
                {
                    name: 'Join screen',
                    note: 'Manual entry and the mocked scan path with all three outcomes.',
                    to: '/transfer',
                },
            ],
        },
        {
            title: 'Accounts and administration',
            entries: [
                {
                    name: 'Sign in',
                    note: 'Wrong address and short password both answer inline.',
                    to: '/signin',
                },
                {
                    name: 'Registration',
                    note: 'Follows whichever policy the installation is set to.',
                    to: '/register',
                },
                {
                    name: 'Password reset',
                    note: 'Mocked send, no mail leaves anything.',
                    to: '/reset',
                },
                {
                    name: 'Member settings',
                    note: 'Profile, appearance, defaults, storage, security, tokens, ShareX.',
                    action: {
                        label: 'Sign in and open',
                        run: () => {
                            setAccount(MEMBER_ID);
                            go('/settings');
                        },
                    },
                },
                {
                    name: 'Administrator settings',
                    note: 'Unsaved, saved, validation error, and destructive confirmation all live on this page.',
                    action: {
                        label: 'Sign in as admin',
                        run: () => {
                            setAccount(ADMIN_ID);
                            go('/admin');
                        },
                    },
                },
            ],
        },
    ];

    return (
        <AppShell>
            <div className="rail py-6 sm:py-9">
                <h1 className="text-xl font-medium tracking-[-0.02em]">
                    State gallery
                </h1>
                <p className="text-muted-foreground mt-2 max-w-[62ch] text-[13.5px] leading-relaxed">
                    Not a product screen. Every state the prototype has to show
                    is listed here with a way to reach it, including the ones
                    that would normally need waiting or bad luck.
                </p>

                <div className="mt-7 flex flex-col gap-8">
                    {groups.map((group) => (
                        <section key={group.title}>
                            <h2 className="label-mono">{group.title}</h2>
                            <ul className="divide-border border-border mt-1 divide-y border-t">
                                {group.entries.map((entry) => (
                                    <Entry key={entry.name} entry={entry} />
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            </div>
        </AppShell>
    );
}
