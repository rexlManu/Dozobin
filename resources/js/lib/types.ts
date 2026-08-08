export type ExpirationKey = '1h' | '1d' | '7d' | '30d' | 'never';

export type PasteType = 'text' | 'markdown' | 'code';

export type ShareKind = 'file' | 'paste';

export type Appearance = 'light' | 'dark' | 'system';

export interface BaseShare {
    /** Unguessable slug. Doubles as the route param. */
    id: string;
    kind: ShareKind;
    /** null means a Guest created it, so it lives in no Library. */
    ownerId: string | null;
    createdAt: number;
    expiresAt: number | null;
    password: string | null;
    views: number;
    payloadDeletedAt?: number | null;
    hasPayload?: boolean | null;
    malwareScan?: MalwareScan | null;
}

export type MalwareScanStatus =
    'pending' | 'clean' | 'detected' | 'failed' | 'skipped';

export interface MalwareScan {
    status: MalwareScanStatus | null;
    detectionName: string | null;
    error: string | null;
    scannedAt: number | null;
}

export interface FileShare extends BaseShare {
    kind: 'file';
    filename: string;
    mime: string;
    size: number;
    /** Object URL when the visitor picked a real File in this session. */
    objectUrl?: string;
    /** Seeded stand-in image for demo rows. */
    demoSrc?: string;
    /** "unavailable" models a share whose stored object went missing. */
    state: 'ready' | 'blocked' | 'unavailable';
}

export interface PasteShare extends BaseShare {
    kind: 'paste';
    body: string;
    pasteType: PasteType;
    language?: string;
    state: 'ready' | 'blocked' | 'unavailable';
}

export type Share = FileShare | PasteShare;

export type UploadFailure = 'type' | 'size' | 'quota' | 'network';

export type UploadStatus =
    'queued' | 'uploading' | 'done' | 'failed' | 'removed';

export interface UploadItem {
    id: string;
    filename: string;
    mime: string;
    size: number;
    status: UploadStatus;
    /** 0-100 */
    progress: number;
    failure?: UploadFailure;
    failureNote?: string;
    shareId?: string;
    objectUrl?: string;
    file?: File;
}

export interface ApiToken {
    id: string;
    name: string;
    /** Full secret is only knowable right after creation. */
    secret: string;
    createdAt: number;
    lastUsedAt: number | null;
    revoked: boolean;
    justCreated?: boolean;
}

export interface LoginSession {
    id: string;
    device: string;
    browser: string;
    location: string;
    lastSeenAt: number;
    current: boolean;
}

export type AccountStatus = 'active' | 'suspended';

export interface Account {
    id: string;
    name: string;
    email: string;
    avatarSrc: string;
    role: 'member' | 'admin';
    createdAt: number;
    status: AccountStatus;
    /** When the administrator suspended it. Null while active. */
    suspendedAt: number | null;
    storageUsed: number;
    storageLimit: number;
    defaultExpiration: ExpirationKey;
    tokens: ApiToken[];
    sessions: LoginSession[];
}

export type TransferItemKind = 'file' | 'image' | 'text';

export interface TransferItem {
    id: string;
    kind: TransferItemKind;
    name: string;
    mime: string;
    size: number;
    body?: string;
    objectUrl?: string;
    file?: File;
    demoSrc?: string;
    addedBy: string;
    addedAt: number;
}

export interface Participant {
    id: string;
    label: string;
    device: string;
    joinedAt: number;
    self: boolean;
}

export interface ActivityEntry {
    id: string;
    at: number;
    actor: string;
    text: string;
}

export interface TransferSession {
    code: string;
    createdAt: number;
    lastActivityAt: number;
    items: TransferItem[];
    participants: Participant[];
    activity: ActivityEntry[];
    /** Set when the inactivity window ran out. Items are gone at that point. */
    expired: boolean;
    /** The current device left on purpose. */
    leftLocally: boolean;
}

export interface AdminConfig {
    guestSharing: boolean;
    registration: 'open' | 'invite' | 'closed';
    guestExpirations: ExpirationKey[];
    memberExpirations: ExpirationKey[];
    guestDefaultExpiration: ExpirationKey;
    memberDefaultExpiration: ExpirationKey;
    guestPasswordProtection: boolean;
    defaultQuotaMb: number;
    maxUploadMb: number;
    fileTypeMode: 'allow' | 'block';
    fileTypeList: string[];
    /** How long a Transfer Session survives without activity. */
    transferWindowHours: number;
    /** Hours after Share expiry before its payload is removed. */
    payloadCleanupGraceHours: number;
    malwareScanningEnabled: boolean;
}

export type Role = 'guest' | 'member' | 'admin';
