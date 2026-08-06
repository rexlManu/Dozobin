import { DAY, HOUR, MINUTE } from './format';
import { picsum, samplePdfUrl, sampleWavUrl } from './sample-media';
import type {
    Account,
    AdminConfig,
    Share,
    TransferItemKind,
    TransferSession,
} from './types';

/** Frozen at module load so every seeded timestamp stays consistent per session. */
export const BOOT = Date.now();

export const DEMO_PASSWORD = 'hinoki';

export const MEMBER_ID = 'acc_ines';
export const ADMIN_ID = 'acc_ruben';

export const ACCOUNTS: Record<string, Account> = {
    [MEMBER_ID]: {
        id: MEMBER_ID,
        name: 'Ines Hartkamp',
        email: 'ines@hartkamp.dev',
        avatarSrc: picsum('dozobin-ines', 128, 128),
        role: 'member',
        createdAt: BOOT - 431 * DAY,
        status: 'active',
        suspendedAt: null,
        // Deliberately larger than her shares actually add up to (~356 MB). This is
        // what drives the near-full storage bar on the Workspace and in Settings,
        // and the administrator's "Recalculate from shares" button exists to fix it.
        storageUsed: 4.71 * 1024 ** 3,
        storageLimit: 6 * 1024 ** 3,
        defaultExpiration: '7d',
        tokens: [
            {
                id: 'tok_sharex',
                name: 'ShareX on the desktop',
                secret: 'dzb_live_9f4c2ae1d77b4e0c8a31',
                createdAt: BOOT - 63 * DAY,
                lastUsedAt: BOOT - 4 * HOUR,
                revoked: false,
            },
            {
                id: 'tok_scripts',
                name: 'Backup script, rack 4B',
                secret: 'dzb_live_2c81be0743fa9d5e6011',
                createdAt: BOOT - 197 * DAY,
                lastUsedAt: BOOT - 11 * DAY,
                revoked: false,
            },
            {
                id: 'tok_old',
                name: 'Old laptop',
                secret: 'dzb_live_5ab30e9c1f6248d7c092',
                createdAt: BOOT - 402 * DAY,
                lastUsedAt: null,
                revoked: true,
            },
        ],
        sessions: [
            {
                id: 'ses_current',
                device: 'ThinkPad T14s',
                browser: 'Firefox 141',
                location: 'Home network',
                lastSeenAt: BOOT,
                current: true,
            },
            {
                id: 'ses_phone',
                device: 'Pixel 9a',
                browser: 'Chrome 139',
                location: 'Mobile data',
                lastSeenAt: BOOT - 3 * HOUR - 12 * MINUTE,
                current: false,
            },
            {
                id: 'ses_studio',
                device: 'Studio iMac',
                browser: 'Safari 19',
                location: 'Office network',
                lastSeenAt: BOOT - 6 * DAY,
                current: false,
            },
        ],
    },
    [ADMIN_ID]: {
        id: ADMIN_ID,
        name: 'Ruben Okonkwo',
        email: 'ruben@okonkwo.systems',
        avatarSrc: picsum('dozobin-ruben', 128, 128),
        role: 'admin',
        createdAt: BOOT - 502 * DAY,
        status: 'active',
        suspendedAt: null,
        storageUsed: 812 * 1024 ** 2,
        storageLimit: 20 * 1024 ** 3,
        defaultExpiration: '30d',
        tokens: [
            {
                id: 'tok_admin_ci',
                name: 'Release pipeline',
                secret: 'dzb_live_77d1cc3e05b8496af0aa',
                createdAt: BOOT - 22 * DAY,
                lastUsedAt: BOOT - 51 * MINUTE,
                revoked: false,
            },
        ],
        sessions: [
            {
                id: 'ses_admin_current',
                device: 'Framework 13',
                browser: 'Firefox 141',
                location: 'Office network',
                lastSeenAt: BOOT,
                current: true,
            },
        ],
    },
};

const GB = 1024 ** 3;
const MB = 1024 ** 2;

const DEVICES: [string, string, string][] = [
    ['MacBook Air', 'Safari 19', 'Home network'],
    ['ThinkPad X1', 'Firefox 141', 'Office network'],
    ['Pixel 9a', 'Chrome 139', 'Mobile data'],
    ['iPad Air', 'Safari 19', 'Home network'],
];

/**
 * The rest of the installation. Written through a factory because twelve full
 * literals would bury the two hand-tuned accounts above, and every field here
 * is either derived or uninteresting.
 */
function member(spec: {
    id: string;
    name: string;
    email: string;
    role?: 'member' | 'admin';
    createdDaysAgo: number;
    usedBytes: number;
    limitBytes: number;
    suspendedDaysAgo?: number;
    sessions?: number;
    tokens?: number;
    revokedTokens?: number;
}): Account {
    const slug = spec.id.replace('acc_', '');
    const suspended = spec.suspendedDaysAgo !== undefined;

    return {
        id: spec.id,
        name: spec.name,
        email: spec.email,
        avatarSrc: picsum(`dozobin-${slug}`, 128, 128),
        role: spec.role ?? 'member',
        createdAt: BOOT - spec.createdDaysAgo * DAY,
        status: suspended ? 'suspended' : 'active',
        suspendedAt: suspended ? BOOT - spec.suspendedDaysAgo! * DAY : null,
        storageUsed: spec.usedBytes,
        storageLimit: spec.limitBytes,
        defaultExpiration: '7d',
        tokens: [
            ...Array.from({ length: spec.tokens ?? 0 }, (_, i) => ({
                id: `tok_${slug}_${i}`,
                name: i === 0 ? 'Desktop uploader' : `Script ${i}`,
                secret: `dzb_live_${slug.padEnd(6, 'x').slice(0, 6)}${String(i).repeat(2)}c4e17b93af20`.slice(
                    0,
                    29,
                ),
                createdAt: BOOT - (30 + i * 44) * DAY,
                lastUsedAt: BOOT - (2 + i * 9) * DAY,
                revoked: false,
            })),
            ...Array.from({ length: spec.revokedTokens ?? 0 }, (_, i) => ({
                id: `tok_${slug}_rev_${i}`,
                name: 'Retired laptop',
                secret: `dzb_live_${slug.padEnd(6, 'x').slice(0, 6)}rv${i}9e4408b1d7c3`.slice(
                    0,
                    29,
                ),
                createdAt: BOOT - 310 * DAY,
                lastUsedAt: null,
                revoked: true,
            })),
        ],
        sessions: Array.from({ length: spec.sessions ?? 0 }, (_, i) => {
            const [device, browser, location] = DEVICES[i % DEVICES.length];

            return {
                id: `ses_${slug}_${i}`,
                device,
                browser,
                location,
                lastSeenAt: BOOT - i * 19 * HOUR,
                current: false,
            };
        }),
    };
}

for (const account of [
    member({
        id: 'acc_tobias',
        name: 'Tobias Vellinga',
        email: 'tobias@vellinga.no',
        role: 'admin',
        createdDaysAgo: 288,
        usedBytes: 1.2 * GB,
        limitBytes: 20 * GB,
        sessions: 2,
        tokens: 1,
    }),
    member({
        id: 'acc_maja',
        name: 'Maja Lindqvist',
        email: 'maja@lindqvist.se',
        createdDaysAgo: 154,
        usedBytes: 2.1 * GB,
        limitBytes: 6 * GB,
        suspendedDaysAgo: 5,
        sessions: 1,
        tokens: 1,
    }),
    member({
        id: 'acc_priya',
        name: 'Priya Raghunathan',
        email: 'priya@raghunathan.dev',
        createdDaysAgo: 96,
        usedBytes: 1.99 * GB,
        limitBytes: 2 * GB,
        sessions: 2,
        tokens: 2,
    }),
    // Joined two days ago and has done nothing at all: the empty detail page.
    member({
        id: 'acc_lennart',
        name: 'Lennart Bosse',
        email: 'lennart@bosse.dev',
        createdDaysAgo: 2,
        usedBytes: 0,
        limitBytes: 6 * GB,
    }),
    member({
        id: 'acc_yuki',
        name: 'Yuki Amanuma',
        email: 'yuki@amanuma.jp',
        createdDaysAgo: 780,
        usedBytes: 9.1 * GB,
        limitBytes: 50 * GB,
        sessions: 3,
        tokens: 2,
    }),
    member({
        id: 'acc_dario',
        name: 'Dario Petrescu',
        email: 'dario@petrescu.ro',
        createdDaysAgo: 61,
        usedBytes: 430 * MB,
        limitBytes: 6 * GB,
        sessions: 1,
    }),
    member({
        id: 'acc_hanne',
        name: 'Hanne Vermeulen',
        email: 'hanne@vermeulen.nl',
        createdDaysAgo: 33,
        usedBytes: 88 * MB,
        limitBytes: 6 * GB,
        sessions: 1,
    }),
    member({
        id: 'acc_kwame',
        name: 'Kwame Osei-Bonsu',
        email: 'kwame@oseibonsu.gh',
        createdDaysAgo: 219,
        usedBytes: 0,
        limitBytes: 6 * GB,
        suspendedDaysAgo: 47,
    }),
    member({
        id: 'acc_marit',
        name: 'Marit Solberg',
        email: 'marit@solberg.no',
        createdDaysAgo: 178,
        usedBytes: 3.4 * GB,
        limitBytes: 12 * GB,
        sessions: 2,
        tokens: 1,
    }),
    member({
        id: 'acc_ezra',
        name: 'Ezra Feldmann',
        email: 'ezra@feldmann.at',
        createdDaysAgo: 412,
        usedBytes: 1.1 * GB,
        limitBytes: 6 * GB,
        revokedTokens: 1,
    }),
]) {
    ACCOUNTS[account.id] = account;
}

const MARKDOWN_BODY = `# Rack 4B handover

Everything below runs on the two new nodes. The old box stays powered until
Friday in case a rollback is needed.

## What changed

- Traefik now terminates TLS for both nodes instead of only \`node-a\`
- Postgres moved to its own volume, snapshots run at 03:15
- The old cron that rotated logs is gone, journald handles it now

## Still open

| Item | Owner | Notes |
| --- | --- | --- |
| Restore drill | Ines | Needs a maintenance slot |
| Alert routing | Tobias | Pager rules not written yet |

> If the restore drill fails, do not roll forward. Page me instead.

\`\`\`bash
systemctl status dozobin.service
journalctl -u dozobin -n 200 --no-pager
\`\`\`
`;

const CODE_BODY = `import { EXPIRATION_MS } from "./format";
import type { ExpirationKey, Share } from "./types";

export function pruneExpired(shares: Share[], now: number): Share[] {
  return shares.filter((share) => share.expiresAt === null || share.expiresAt > now);
}

export function nextSweep(key: ExpirationKey, from: number): number | null {
  const window = EXPIRATION_MS[key];
  if (window === null) return null;
  // Sweep at a quarter of the window so a 1h share never lingers past 1h15.
  return from + Math.min(window / 4, 6 * 60 * 60 * 1000);
}
`;

const SQL_BODY = `-- Shares that will drop out of storage in the next hour.
select
  s.id,
  s.kind,
  s.filename,
  pg_size_pretty(s.size_bytes) as size,
  s.expires_at - now() as remaining
from shares s
where s.expires_at is not null
  and s.expires_at < now() + interval '1 hour'
order by s.expires_at asc
limit 50;
`;

const TEXT_BODY = `Node A  10.4.19.11   traefik, dozobin
Node B  10.4.19.12   postgres, minio
Switch  10.4.19.1    mgmt vlan 40

Serial console is on the grey USB adapter in the second drawer.
Baud 115200, 8N1, no flow control.

If node B refuses to boot, pull the second NVMe and try again. It has
failed SMART twice and it is the usual reason.
`;

const DIFF_BODY = `diff --git a/config/dozobin.toml b/config/dozobin.toml
index 8c41a2f..b7f1e04 100644
--- a/config/dozobin.toml
+++ b/config/dozobin.toml
@@ -12,9 +12,11 @@ max_upload_mb = 512

 [guests]
-enabled = false
-expirations = ["1h"]
+enabled = true
+expirations = ["1h", "1d", "7d"]
+password_protection = true

 [members]
 default_quota_mb = 6144
+default_expiration = "7d"
`;

export function seedShares(): Share[] {
    return [
        {
            id: 'q7m2xrk9pd',
            kind: 'file',
            ownerId: MEMBER_ID,
            createdAt: BOOT - 41 * MINUTE,
            expiresAt: BOOT + 19 * MINUTE,
            password: null,
            views: 3,
            filename: 'rack-4b-before-cabling.jpg',
            mime: 'image/jpeg',
            size: 3_284_112,
            demoSrc: picsum('dozobin-rack', 1600, 1067),
            state: 'ready',
        },
        {
            id: 'vn4bt8scwe',
            kind: 'paste',
            ownerId: MEMBER_ID,
            createdAt: BOOT - 2 * HOUR,
            expiresAt: BOOT + 22 * HOUR,
            password: null,
            views: 11,
            body: MARKDOWN_BODY,
            pasteType: 'markdown',
            state: 'ready',
        },
        {
            id: 'hs93kqdz2m',
            kind: 'file',
            ownerId: MEMBER_ID,
            createdAt: BOOT - 5 * HOUR,
            expiresAt: BOOT + 6 * DAY + 19 * HOUR,
            password: DEMO_PASSWORD,
            views: 2,
            filename: 'invoice-2026-0417.pdf',
            mime: 'application/pdf',
            size: 214_338,
            demoSrc: samplePdfUrl(),
            state: 'ready',
        },
        {
            id: 'wc61jrpx4a',
            kind: 'paste',
            ownerId: MEMBER_ID,
            createdAt: BOOT - 9 * HOUR,
            expiresAt: BOOT + 38 * MINUTE,
            password: null,
            views: 27,
            body: SQL_BODY,
            pasteType: 'code',
            language: 'sql',
            state: 'ready',
        },
        {
            id: 'tz85nfhb3q',
            kind: 'file',
            ownerId: MEMBER_ID,
            createdAt: BOOT - 26 * HOUR,
            expiresAt: BOOT + 5 * DAY,
            password: null,
            views: 8,
            filename: 'traefik-config-backup.tar.gz',
            mime: 'application/x-tar',
            size: 19_284_003,
            state: 'ready',
        },
        {
            id: 'km37xdws9e',
            kind: 'paste',
            ownerId: MEMBER_ID,
            createdAt: BOOT - 2 * DAY,
            expiresAt: null,
            password: null,
            views: 64,
            body: TEXT_BODY,
            pasteType: 'text',
            state: 'ready',
        },
        {
            id: 'bp29qtmc7h',
            kind: 'file',
            ownerId: MEMBER_ID,
            createdAt: BOOT - 3 * DAY - 4 * HOUR,
            expiresAt: BOOT + 3 * DAY,
            password: null,
            views: 5,
            filename: 'screen-capture-migration.mp4',
            mime: 'video/mp4',
            size: 44_812_990,
            demoSrc: picsum('dozobin-migration', 1280, 720),
            state: 'ready',
        },
        {
            id: 'dr58wgka1n',
            kind: 'file',
            ownerId: MEMBER_ID,
            createdAt: BOOT - 4 * DAY,
            expiresAt: BOOT + 26 * DAY,
            password: null,
            views: 1,
            filename: 'voice-memo-standup.wav',
            mime: 'audio/wav',
            size: 96_044,
            demoSrc: sampleWavUrl(),
            state: 'ready',
        },
        {
            id: 'gx71ndzq5t',
            kind: 'paste',
            ownerId: MEMBER_ID,
            createdAt: BOOT - 5 * DAY,
            expiresAt: BOOT + 25 * DAY,
            password: null,
            views: 19,
            body: CODE_BODY,
            pasteType: 'code',
            language: 'typescript',
            state: 'ready',
        },
        {
            id: 'jf40chrm8w',
            kind: 'file',
            ownerId: MEMBER_ID,
            createdAt: BOOT - 6 * DAY,
            expiresAt: null,
            password: null,
            views: 42,
            filename: 'dashboard-after-migration.png',
            mime: 'image/png',
            size: 1_402_881,
            demoSrc: picsum('dozobin-dashboard', 1600, 900),
            state: 'ready',
        },
        {
            id: 'ly62smvb0k',
            kind: 'paste',
            ownerId: MEMBER_ID,
            createdAt: BOOT - 8 * DAY,
            expiresAt: BOOT + 22 * DAY,
            password: DEMO_PASSWORD,
            views: 6,
            body: DIFF_BODY,
            pasteType: 'code',
            language: 'diff',
            state: 'ready',
        },
        {
            id: 'nq18ezpt6r',
            kind: 'file',
            ownerId: MEMBER_ID,
            createdAt: BOOT - 11 * DAY,
            expiresAt: BOOT + 19 * DAY,
            password: null,
            views: 0,
            filename: 'postgres-dump-2026-07-02.sql.gz',
            mime: 'application/gzip',
            size: 288_004_112,
            state: 'unavailable',
        },
        {
            id: 'ah05rvyd3c',
            kind: 'file',
            ownerId: ADMIN_ID,
            createdAt: BOOT - 30 * MINUTE,
            expiresAt: BOOT + 29 * DAY + 23 * HOUR,
            password: null,
            views: 1,
            filename: 'installation-checklist.pdf',
            mime: 'application/pdf',
            size: 214_338,
            demoSrc: samplePdfUrl(),
            state: 'ready',
        },
        {
            id: 'ct46kbwn2j',
            kind: 'paste',
            ownerId: ADMIN_ID,
            createdAt: BOOT - 3 * HOUR,
            expiresAt: BOOT + 29 * DAY,
            password: null,
            views: 4,
            body: `# Registration is invite only until Monday\n\nHand out invites from the admin area. Guest sharing stays on, capped at 7 days.\n`,
            pasteType: 'markdown',
            state: 'ready',
        },
        {
            /* Guest-created, so it belongs to no Library. Reachable by URL only. */
            id: 'ez30mwqk7v',
            kind: 'paste',
            ownerId: null,
            createdAt: BOOT - 20 * MINUTE,
            expiresAt: BOOT + 40 * MINUTE,
            password: null,
            views: 1,
            body: 'wifi: hinoki-guest\npass: 4472-tempest-oak\n\nExpires with this paste.',
            pasteType: 'text',
            state: 'ready',
        },
        ...otherOwnersShares(),
    ];
}

/**
 * Everything above belongs to Ines, Ruben, or nobody, and is what the Library
 * and the seeded deep links depend on. These belong to the rest of the
 * installation and exist so the administrator's global view has something to
 * administer: several owners, more Guest shares to sweep, expired rows, a
 * second broken object, and a couple more behind passwords.
 */
function otherOwnersShares(): Share[] {
    const file = (
        id: string,
        ownerId: string | null,
        filename: string,
        mime: string,
        size: number,
        opts: Partial<Share> & {
            createdDaysAgo: number;
            expiresInDays: number | null;
        },
    ): Share => ({
        id,
        kind: 'file',
        ownerId,
        createdAt: BOOT - opts.createdDaysAgo * DAY,
        expiresAt:
            opts.expiresInDays === null
                ? null
                : BOOT + opts.expiresInDays * DAY,
        password: (opts.password as string | null) ?? null,
        views: (opts.views as number) ?? 0,
        filename,
        mime,
        size,
        state: (opts.state as 'ready' | 'unavailable') ?? 'ready',
        ...(mime.startsWith('image/')
            ? { demoSrc: picsum(`dozobin-${id}`, 1400, 933) }
            : {}),
    });

    const paste = (
        id: string,
        ownerId: string | null,
        body: string,
        pasteType: 'text' | 'markdown' | 'code',
        opts: {
            createdDaysAgo: number;
            expiresInDays: number | null;
            language?: string;
            views?: number;
            password?: string | null;
        },
    ): Share => ({
        id,
        kind: 'paste',
        ownerId,
        createdAt: BOOT - opts.createdDaysAgo * DAY,
        expiresAt:
            opts.expiresInDays === null
                ? null
                : BOOT + opts.expiresInDays * DAY,
        password: opts.password ?? null,
        views: opts.views ?? 0,
        body,
        pasteType,
        ...(opts.language ? { language: opts.language } : {}),
        state: 'ready',
    });

    return [
        // Tobias, the second administrator.
        file(
            'tb01xkqm4d',
            'acc_tobias',
            'switch-config-vlan40.txt',
            'text/plain',
            12_884,
            { createdDaysAgo: 1, expiresInDays: 6, views: 3 },
        ),
        file(
            'tb02pnwz7g',
            'acc_tobias',
            'datacentre-floorplan.png',
            'image/png',
            2_204_881,
            { createdDaysAgo: 4, expiresInDays: 20, views: 9 },
        ),
        paste('tb03mcra9h', 'acc_tobias', DIFF_BODY, 'code', {
            createdDaysAgo: 2,
            expiresInDays: 12,
            language: 'diff',
            views: 4,
        }),

        // Maja, suspended five days ago. Her shares keep resolving.
        file(
            'mj01dvbe2k',
            'acc_maja',
            'campaign-cut-final.mp4',
            'video/mp4',
            1_284_004_112,
            { createdDaysAgo: 9, expiresInDays: 4, views: 22 },
        ),
        file(
            'mj02qslt8n',
            'acc_maja',
            'brand-photos.zip',
            'application/zip',
            812_004_990,
            { createdDaysAgo: 12, expiresInDays: null, views: 7 },
        ),
        file(
            'mj03hwyu5p',
            'acc_maja',
            'poster-draft.jpg',
            'image/jpeg',
            4_120_774,
            {
                createdDaysAgo: 6,
                expiresInDays: 9,
                views: 2,
                password: DEMO_PASSWORD,
            },
        ),
        paste('mj04ztkc1r', 'acc_maja', TEXT_BODY, 'text', {
            createdDaysAgo: 15,
            expiresInDays: 30,
            views: 5,
        }),

        // Priya, at 99.6% of a 2 GB quota.
        file(
            'pr01axnf6v',
            'acc_priya',
            'dataset-2026-q2.tar.gz',
            'application/gzip',
            1_904_112_640,
            { createdDaysAgo: 3, expiresInDays: 11, views: 1 },
        ),
        file(
            'pr02ejrw3b',
            'acc_priya',
            'notebook-export.pdf',
            'application/pdf',
            884_002,
            { createdDaysAgo: 7, expiresInDays: 2, views: 12 },
        ),
        paste('pr03ugqd9m', 'acc_priya', CODE_BODY, 'code', {
            createdDaysAgo: 5,
            expiresInDays: 25,
            language: 'typescript',
            views: 8,
        }),

        // Yuki, oldest account, largest quota.
        file(
            'yk01nbvc4x',
            'acc_yuki',
            'archive-2024-full.tar',
            'application/x-tar',
            6_884_002_990,
            { createdDaysAgo: 40, expiresInDays: null, views: 31 },
        ),
        file(
            'yk02rmkp7t',
            'acc_yuki',
            'keynote-recording.mp4',
            'video/mp4',
            2_004_887_331,
            { createdDaysAgo: 22, expiresInDays: 18, views: 44 },
        ),
        // A second stored object that went missing.
        file(
            'yk03fdsw2q',
            'acc_yuki',
            'old-backup.sql.gz',
            'application/gzip',
            412_003_118,
            {
                createdDaysAgo: 120,
                expiresInDays: 3,
                views: 0,
                state: 'unavailable',
            },
        ),
        paste('yk04ljhe8c', 'acc_yuki', SQL_BODY, 'code', {
            createdDaysAgo: 30,
            expiresInDays: null,
            language: 'sql',
            views: 17,
        }),

        // Dario, Hanne, Marit, Ezra.
        file(
            'dr01wqzn5f',
            'acc_dario',
            'site-audit.pdf',
            'application/pdf',
            402_889,
            { createdDaysAgo: 8, expiresInDays: 14, views: 6 },
        ),
        paste('dr02kcvb3j', 'acc_dario', MARKDOWN_BODY, 'markdown', {
            createdDaysAgo: 11,
            expiresInDays: 7,
            views: 3,
        }),
        file(
            'hn01tygu9d',
            'acc_hanne',
            'meeting-notes.png',
            'image/png',
            92_004_118,
            { createdDaysAgo: 2, expiresInDays: 5, views: 1 },
        ),
        file(
            'mr01pzex6w',
            'acc_marit',
            'field-recordings.wav',
            'audio/wav',
            2_884_002,
            { createdDaysAgo: 18, expiresInDays: 22, views: 4 },
        ),
        file(
            'mr02jbnh4s',
            'acc_marit',
            'survey-raw.zip',
            'application/zip',
            3_404_118_990,
            { createdDaysAgo: 25, expiresInDays: null, views: 2 },
        ),
        // Already expired: the administrator should see rows worth sweeping.
        paste('mr03cxlv7a', 'acc_marit', TEXT_BODY, 'text', {
            createdDaysAgo: 40,
            expiresInDays: null,
            views: 9,
        }),
        file(
            'ez01qmtk2y',
            'acc_ezra',
            'invoice-archive.zip',
            'application/zip',
            1_104_002_881,
            { createdDaysAgo: 60, expiresInDays: 45, views: 11 },
        ),
        paste('ez02vdrf8u', 'acc_ezra', CODE_BODY, 'code', {
            createdDaysAgo: 55,
            expiresInDays: -1,
            language: 'typescript',
            views: 20,
        }),

        // Guest shares. Housekeeping sweeps these, and they belong to no Library.
        paste(
            'gu01hsyq3n',
            null,
            'docker compose up -d\ndocker compose logs -f dozobin',
            'text',
            { createdDaysAgo: 0, expiresInDays: -1, views: 4 },
        ),
        file('gu02lkwd6b', null, 'screenshot-error.png', 'image/png', 448_112, {
            createdDaysAgo: 0,
            expiresInDays: 1,
            views: 2,
        }),
        paste(
            'gu03nxpa9e',
            null,
            'meeting link: https://example.invalid/room/4472',
            'text',
            { createdDaysAgo: 1, expiresInDays: 3, views: 1 },
        ),
    ];
}

export function seedTransferSession(): TransferSession {
    return {
        code: 'K7MQ2XPD',
        createdAt: BOOT - 47 * MINUTE,
        lastActivityAt: BOOT - 6 * MINUTE,
        leftLocally: false,
        expired: false,
        participants: [
            {
                id: 'p_self',
                label: 'This device',
                device: 'ThinkPad T14s',
                joinedAt: BOOT - 47 * MINUTE,
                self: true,
            },
            {
                id: 'p_phone',
                label: 'Pixel 9a',
                device: 'Android',
                joinedAt: BOOT - 44 * MINUTE,
                self: false,
            },
            {
                id: 'p_tablet',
                label: 'iPad mini',
                device: 'iPadOS',
                joinedAt: BOOT - 12 * MINUTE,
                self: false,
            },
        ],
        items: [
            {
                id: 'ti_shot',
                kind: 'image',
                name: 'screenshot-boot-error.png',
                mime: 'image/png',
                size: 486_221,
                demoSrc: picsum('dozobin-booterror', 1400, 900),
                addedBy: 'p_phone',
                addedAt: BOOT - 41 * MINUTE,
            },
            {
                id: 'ti_text',
                kind: 'text',
                name: 'Pasted text',
                mime: 'text/plain',
                size: 148,
                body: 'console cable is in the second drawer\nbaud 115200 8N1\n\nif it hangs at grub, hold shift and pick the 6.6 kernel',
                addedBy: 'p_self',
                addedAt: BOOT - 33 * MINUTE,
            },
            {
                id: 'ti_pdf',
                kind: 'file',
                name: 'invoice-2026-0417.pdf',
                mime: 'application/pdf',
                size: 214_338,
                demoSrc: samplePdfUrl(),
                addedBy: 'p_tablet',
                addedAt: BOOT - 11 * MINUTE,
            },
            {
                id: 'ti_zip',
                kind: 'file',
                name: 'firmware-4b.zip',
                mime: 'application/zip',
                size: 8_120_440,
                addedBy: 'p_phone',
                addedAt: BOOT - 6 * MINUTE,
            },
        ],
        activity: [
            {
                id: 'ac_1',
                at: BOOT - 6 * MINUTE,
                actor: 'Pixel 9a',
                text: 'added firmware-4b.zip',
            },
            {
                id: 'ac_2',
                at: BOOT - 11 * MINUTE,
                actor: 'iPad mini',
                text: 'added invoice-2026-0417.pdf',
            },
            {
                id: 'ac_3',
                at: BOOT - 12 * MINUTE,
                actor: 'iPad mini',
                text: 'joined the session',
            },
            {
                id: 'ac_4',
                at: BOOT - 19 * MINUTE,
                actor: 'This device',
                text: 'downloaded screenshot-boot-error.png',
            },
            {
                id: 'ac_5',
                at: BOOT - 33 * MINUTE,
                actor: 'This device',
                text: 'added pasted text',
            },
            {
                id: 'ac_6',
                at: BOOT - 41 * MINUTE,
                actor: 'Pixel 9a',
                text: 'added screenshot-boot-error.png',
            },
            {
                id: 'ac_7',
                at: BOOT - 44 * MINUTE,
                actor: 'Pixel 9a',
                text: 'joined the session',
            },
            {
                id: 'ac_8',
                at: BOOT - 47 * MINUTE,
                actor: 'This device',
                text: 'created the session',
            },
        ],
    };
}

/** A second session that already ran out its inactivity window. */
export const EXPIRED_CODE = 'R3TWQ8FN';

/**
 * Everything the administrator can see across the installation. The live
 * session the current device is in is *not* in here — the store prepends it, so
 * there is exactly one record of it and the countdown on both pages agrees.
 *
 * A Transfer Session is peer-to-peer and unauthenticated by design, so these
 * carry device labels rather than accounts. That is the honest model: the
 * administrator sees that a session existed and how big it got, not who was in
 * it, and the sessions page says so.
 */
function pastSession(
    code: string,
    startedAgo: number,
    idleFor: number,
    devices: string[],
    items: {
        name: string;
        mime: string;
        size: number;
        kind: TransferItemKind;
    }[],
    expired: boolean,
): TransferSession {
    const createdAt = BOOT - startedAgo;
    const lastActivityAt = BOOT - idleFor;

    return {
        code,
        createdAt,
        lastActivityAt,
        expired,
        leftLocally: true,
        participants: devices.map((device, index) => ({
            id: `p_${code}_${index}`,
            label: device,
            device,
            joinedAt: createdAt + index * MINUTE,
            self: false,
        })),
        // An expired session has dropped its payload; only the record survives. So
        // the table shows a dash rather than a size for those rows, and the activity
        // log is the only trace of what went through.
        items: expired
            ? []
            : items.map((item, index) => ({
                  ...item,
                  id: `ti_${code}_${index}`,
                  addedBy: `p_${code}_${index % devices.length}`,
                  addedAt: createdAt + (index + 1) * 3 * MINUTE,
              })),
        activity: [
            {
                id: `ac_${code}_z`,
                at: lastActivityAt,
                actor: devices[0],
                text: expired ? 'session expired' : 'left the session',
            },
            ...items.map((item, index) => ({
                id: `ac_${code}_${index}`,
                at: createdAt + (index + 1) * 3 * MINUTE,
                actor: devices[index % devices.length],
                text: `added ${item.name}`,
            })),
            {
                id: `ac_${code}_a`,
                at: createdAt,
                actor: devices[0],
                text: 'created the session',
            },
        ],
    };
}

export function seedTransferHistory(): TransferSession[] {
    return [
        // Live but nearly out of window — the one worth acting on.
        pastSession(
            'T4VB9HKC',
            13 * HOUR,
            11 * HOUR + 26 * MINUTE,
            ['Framework 13', 'Galaxy S24'],
            [
                {
                    name: 'roofline-survey.heic',
                    mime: 'image/heic',
                    size: 4_812_004,
                    kind: 'image',
                },
                {
                    name: 'measurements.csv',
                    mime: 'text/csv',
                    size: 18_442,
                    kind: 'file',
                },
            ],
            false,
        ),
        pastSession(
            '8QWMZ3RJ',
            2 * HOUR + 12 * MINUTE,
            38 * MINUTE,
            ['MacBook Air', 'iPhone 15', 'Studio display'],
            [
                {
                    name: 'keynote-final-v4.pdf',
                    mime: 'application/pdf',
                    size: 22_408_112,
                    kind: 'file',
                },
                {
                    name: 'speaker-notes.txt',
                    mime: 'text/plain',
                    size: 4_190,
                    kind: 'text',
                },
                {
                    name: 'stage-plot.png',
                    mime: 'image/png',
                    size: 1_204_776,
                    kind: 'image',
                },
            ],
            false,
        ),
        pastSession(
            'P2LNY7XD',
            5 * HOUR,
            3 * HOUR + 4 * MINUTE,
            ['ThinkPad T14s', 'Pixel 9a'],
            [
                {
                    name: 'vpn-profile.ovpn',
                    mime: 'application/octet-stream',
                    size: 6_612,
                    kind: 'file',
                },
            ],
            false,
        ),
        pastSession(
            EXPIRED_CODE,
            2 * DAY,
            2 * DAY - 40 * MINUTE,
            ['Unknown device'],
            [
                {
                    name: 'logs-2026-08-02.tar.gz',
                    mime: 'application/gzip',
                    size: 91_224_800,
                    kind: 'file',
                },
            ],
            true,
        ),
        pastSession(
            'JD6KRW1S',
            4 * DAY,
            4 * DAY - 2 * HOUR,
            ['Surface Pro', 'Redmi Note 13', 'Chromebook', 'Steam Deck'],
            [
                {
                    name: 'conference-photos.zip',
                    mime: 'application/zip',
                    size: 412_990_112,
                    kind: 'file',
                },
                {
                    name: 'attendee-list.csv',
                    mime: 'text/csv',
                    size: 82_004,
                    kind: 'file',
                },
            ],
            true,
        ),
        pastSession(
            'HG55TQ8B',
            9 * DAY,
            9 * DAY - 14 * MINUTE,
            ['iPad mini'],
            [],
            true,
        ),
        pastSession(
            'ZC03MVLA',
            21 * DAY,
            21 * DAY - 51 * MINUTE,
            ['Pixel 9a', 'ThinkPad T14s'],
            [
                {
                    name: 'scan-lease-signed.pdf',
                    mime: 'application/pdf',
                    size: 3_118_902,
                    kind: 'file',
                },
                {
                    name: 'bank details',
                    mime: 'text/plain',
                    size: 212,
                    kind: 'text',
                },
            ],
            true,
        ),
    ];
}

export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
    guestSharing: true,
    registration: 'invite',
    guestExpirations: ['1h', '1d', '7d'],
    memberExpirations: ['1h', '1d', '7d', '30d', 'never'],
    guestDefaultExpiration: '1d',
    memberDefaultExpiration: '7d',
    guestPasswordProtection: true,
    defaultQuotaMb: 6144,
    maxUploadMb: 512,
    fileTypeMode: 'block',
    fileTypeList: ['exe', 'msi', 'bat', 'cmd', 'scr', 'jar'],
    transferWindowHours: 12,
};
