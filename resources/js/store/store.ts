import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { create } from 'zustand';
import { csrfToken, firstApiError, requestJson } from '@/lib/api';
import { EXPIRATION_MS, fileExtension, makeId } from '@/lib/format';
import { usageFromShares } from '@/lib/share-display';
import type {
    Account,
    AccountStatus,
    AdminConfig,
    Appearance,
    ExpirationKey,
    FileShare,
    PasteShare,
    PasteType,
    Role,
    Share,
    TransferItem,
    TransferSession,
    UploadFailure,
    UploadItem,
} from '@/lib/types';

export const DEFAULT_TRANSFER_WINDOW_HOURS = 12;
export const EXPIRED_CODE = 'OLD12HRS';
export const ADMIN_ID = '';
export const MEMBER_ID = '';
export const BOOT = Date.now();

export type UploadFault = 'none' | 'flaky' | 'offline';
export type GuardReason = 'self' | 'last-admin' | 'missing';

export interface JoinResult {
    ok: boolean;
    reason?: 'invalid' | 'expired';
}

export interface SignInResult {
    ok: boolean;
    reason?: 'unknown' | 'suspended';
}

const defaultConfig: AdminConfig = {
    guestSharing: true,
    registration: 'open',
    guestExpirations: ['1h', '1d', '7d'],
    memberExpirations: ['1h', '1d', '7d', '30d', 'never'],
    guestDefaultExpiration: '1d',
    memberDefaultExpiration: '7d',
    guestPasswordProtection: true,
    defaultQuotaMb: 5120,
    maxUploadMb: 512,
    fileTypeMode: 'block',
    fileTypeList: ['exe', 'msi', 'bat', 'cmd'],
    transferWindowHours: 12,
};

export interface DozoStateSnapshot {
    accounts: Record<string, Account>;
    currentAccountId: string | null;
    shares: Share[];
    queue: UploadItem[];
    transfer: TransferSession | null;
    transferHistory: TransferSession[];
    adminConfig: AdminConfig;
    adminDraft: AdminConfig;
    appearance: Appearance;
    uploadFault: UploadFault;
    unlocked: string[];
    impersonating: string | null;
}

interface DozoState extends DozoStateSnapshot {
    hydratedSnapshot: DozoStateSnapshot | null;
    hydrate: (snapshot: DozoStateSnapshot) => void;
    role: () => Role;
    account: () => Account | null;
    allowedExpirations: () => ExpirationKey[];
    defaultExpiration: () => ExpirationKey;
    canProtect: () => boolean;
    realAccountId: () => string | null;
    realRole: () => Role;
    activeAdminCount: (change?: {
        id: string;
        role?: Account['role'];
        status?: AccountStatus;
        deleted?: boolean;
    }) => number;
    transferWindowMs: () => number;
    guardAccount: (
        targetId: string,
        next: {
            role?: Account['role'];
            status?: AccountStatus;
            deleted?: boolean;
        },
    ) => GuardReason | null;
    setAccountQuota: (accountId: string, limitBytes: number) => void;
    setAccountRole: (accountId: string, role: Account['role']) => boolean;
    setAccountStatus: (accountId: string, status: AccountStatus) => boolean;
    deleteUser: (accountId: string) => boolean;
    endUserSession: (accountId: string, sessionId: string) => void;
    revokeUserToken: (accountId: string, tokenId: string) => void;
    recalcUsage: (accountId: string) => void;
    viewAs: (accountId: string) => void;
    stopViewingAs: () => void;
    signIn: (email: string) => SignInResult;
    signOut: () => void;
    setAccount: (id: string | null) => void;
    setAppearance: (value: Appearance) => void;
    setUploadFault: (value: UploadFault) => void;
    enqueue: (files: File[]) => string[];
    startUpload: (
        id: string,
        expiration: ExpirationKey,
        password: string | null,
    ) => void;
    retryUpload: (
        id: string,
        expiration: ExpirationKey,
        password: string | null,
    ) => void;
    removeUpload: (id: string) => void;
    clearQueue: () => void;
    createPaste: (input: {
        body: string;
        pasteType: PasteType;
        language?: string;
        expiration: ExpirationKey;
        password: string | null;
    }) => Promise<PasteShare>;
    findShare: (id: string) => Share | undefined;
    deleteShares: (ids: string[]) => void;
    unlock: (id: string, password: string) => Promise<boolean>;
    registerView: (id: string) => void;
    updateProfile: (
        patch: Partial<Pick<Account, 'name' | 'email' | 'defaultExpiration'>>,
    ) => void;
    updateAvatar: (file: File | null) => void;
    createToken: (name: string) => void;
    revokeToken: (id: string) => void;
    dismissTokenSecret: (id: string) => void;
    endLoginSession: (id: string) => void;
    deleteAccount: () => void;
    fillStorage: () => void;
    createTransfer: () => Promise<TransferSession>;
    joinTransfer: (code: string) => Promise<JoinResult>;
    leaveTransfer: () => void;
    addTransferItems: (
        items: Omit<TransferItem, 'id' | 'addedAt' | 'addedBy'>[],
    ) => void;
    deleteTransferItem: (id: string) => void;
    touchTransfer: (note?: string) => void;
    ageTransfer: (ms: number) => void;
    endTransferSession: (code: string) => void;
    deleteTransferSession: (code: string) => void;
    setAdminDraft: (patch: Partial<AdminConfig>) => void;
    saveAdmin: () => void;
    resetAdmin: () => void;
    resetDemo: () => void;
}

interface ResourceResponse<T> {
    data: T;
}

function cloneConfig(config: AdminConfig): AdminConfig {
    return {
        ...config,
        guestExpirations: [...config.guestExpirations],
        memberExpirations: [...config.memberExpirations],
        fileTypeList: [...config.fileTypeList],
    };
}

function patchAccount(
    accounts: Record<string, Account>,
    id: string | null,
    update: (account: Account) => Account,
) {
    if (!id || !accounts[id]) {
        return accounts;
    }

    return { ...accounts, [id]: update(accounts[id]) };
}

function guessMime(file: File): string {
    if (file.type) {
        return file.type;
    }

    const ext = fileExtension(file.name);

    return (
        (
            {
                zip: 'application/zip',
                gz: 'application/gzip',
                md: 'text/markdown',
            } as Record<string, string>
        )[ext] ?? 'application/octet-stream'
    );
}

function updateAdminUser(
    accountId: string,
    patch: Record<string, string | number>,
): void {
    void requestJson(`/admin/users/${accountId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
    }).catch((error) => toast.error(firstApiError(error)));
}

export const useDozo = create<DozoState>((set, get) => ({
    accounts: {},
    currentAccountId: null,
    shares: [],
    queue: [],
    transfer: null,
    transferHistory: [],
    adminConfig: cloneConfig(defaultConfig),
    adminDraft: cloneConfig(defaultConfig),
    appearance: 'system',
    uploadFault: 'none',
    unlocked: [],
    impersonating: null,
    hydratedSnapshot: null,

    hydrate: (snapshot) =>
        set((state) => ({
            ...snapshot,
            queue: state.queue,
            hydratedSnapshot: snapshot,
        })),

    role: () => get().account()?.role ?? 'guest',
    account: () =>
        get().currentAccountId
            ? (get().accounts[get().currentAccountId!] ?? null)
            : null,
    allowedExpirations: () =>
        get().currentAccountId
            ? get().adminConfig.memberExpirations
            : get().adminConfig.guestExpirations,
    defaultExpiration: () => {
        const account = get().account();

        if (!account) {
            return get().adminConfig.guestDefaultExpiration;
        }

        return get().adminConfig.memberExpirations.includes(
            account.defaultExpiration,
        )
            ? account.defaultExpiration
            : get().adminConfig.memberDefaultExpiration;
    },
    canProtect: () =>
        get().currentAccountId !== null ||
        get().adminConfig.guestPasswordProtection,
    realAccountId: () => get().impersonating ?? get().currentAccountId,
    realRole: () =>
        get().realAccountId()
            ? (get().accounts[get().realAccountId()!]?.role ?? 'guest')
            : 'guest',
    activeAdminCount: (change) =>
        Object.values(get().accounts).filter((account) => {
            if (change?.id === account.id) {
                return (
                    !change.deleted &&
                    (change.role ?? account.role) === 'admin' &&
                    (change.status ?? account.status) === 'active'
                );
            }

            return account.role === 'admin' && account.status === 'active';
        }).length,
    transferWindowMs: () =>
        get().adminConfig.transferWindowHours * 60 * 60 * 1000,
    guardAccount: (targetId, next) => {
        if (!get().accounts[targetId]) {
            return 'missing';
        }

        const locksOut =
            next.deleted ||
            next.role === 'member' ||
            next.status === 'suspended';

        if (targetId === get().realAccountId() && locksOut) {
            return 'self';
        }

        if (get().activeAdminCount({ id: targetId, ...next }) === 0) {
            return 'last-admin';
        }

        return null;
    },

    setAccountQuota: (id, limit) => {
        set((state) => ({
            accounts: patchAccount(state.accounts, id, (account) => ({
                ...account,
                storageLimit: limit,
            })),
        }));
        updateAdminUser(id, { storage_limit: Math.max(0, Math.round(limit)) });
    },
    setAccountRole: (id, role) => {
        if (get().guardAccount(id, { role })) {
            return false;
        }

        set((state) => ({
            accounts: patchAccount(state.accounts, id, (account) => ({
                ...account,
                role,
            })),
        }));
        updateAdminUser(id, { role });

        return true;
    },
    setAccountStatus: (id, status) => {
        if (get().guardAccount(id, { status })) {
            return false;
        }

        set((state) => ({
            accounts: patchAccount(state.accounts, id, (account) => ({
                ...account,
                status,
                suspendedAt: status === 'suspended' ? Date.now() : null,
            })),
        }));
        updateAdminUser(id, { status });

        return true;
    },
    deleteUser: (id) => {
        if (get().guardAccount(id, { deleted: true })) {
            return false;
        }

        set((state) => {
            const accounts = { ...state.accounts };
            delete accounts[id];

            return {
                accounts,
                shares: state.shares.filter((share) => share.ownerId !== id),
            };
        });
        void requestJson(`/admin/users/${id}`, { method: 'DELETE' }).catch(
            (error) => toast.error(firstApiError(error)),
        );

        return true;
    },
    endUserSession: (accountId, sessionId) => {
        set((state) => ({
            accounts: patchAccount(state.accounts, accountId, (account) => ({
                ...account,
                sessions: account.sessions.filter(
                    (session) => session.id !== sessionId,
                ),
            })),
        }));
        const endpoint =
            accountId === get().currentAccountId
                ? `/profile/sessions/${sessionId}`
                : `/admin/users/${accountId}/sessions/${sessionId}`;
        void requestJson(endpoint, { method: 'DELETE' }).catch((error) =>
            toast.error(firstApiError(error)),
        );
    },
    revokeUserToken: (accountId, tokenId) => {
        set((state) => ({
            accounts: patchAccount(state.accounts, accountId, (account) => ({
                ...account,
                tokens: account.tokens.map((token) =>
                    token.id === tokenId ? { ...token, revoked: true } : token,
                ),
            })),
        }));
        void requestJson(`/api-tokens/${tokenId}`, { method: 'DELETE' }).catch(
            (error) => toast.error(firstApiError(error)),
        );
    },
    recalcUsage: (accountId) =>
        set((state) => ({
            accounts: patchAccount(state.accounts, accountId, (account) => ({
                ...account,
                storageUsed: usageFromShares(state.shares, accountId),
            })),
        })),
    viewAs: (accountId) => {
        void requestJson(`/admin/users/${accountId}/impersonate`, {
            method: 'POST',
        })
            .then(() => router.visit('/'))
            .catch((error) => toast.error(firstApiError(error)));
    },
    stopViewingAs: () => {
        void requestJson('/impersonation', { method: 'DELETE' })
            .then(() => router.visit('/admin/users'))
            .catch((error) => toast.error(firstApiError(error)));
    },
    signIn: () => ({ ok: false, reason: 'unknown' }),
    signOut: () => router.post('/logout'),
    setAccount: (id) => set({ currentAccountId: id, impersonating: null }),
    setAppearance: (appearance) => {
        set({ appearance });

        if (get().currentAccountId) {
            void requestJson('/profile', {
                method: 'PATCH',
                body: JSON.stringify({ appearance }),
            }).catch((error) => toast.error(firstApiError(error)));
        }
    },
    setUploadFault: (uploadFault) => set({ uploadFault }),

    enqueue: (files) => {
        const items = files.map((file): UploadItem => ({
            id: makeId('up'),
            filename: file.name,
            mime: guessMime(file),
            size: file.size,
            status: 'queued',
            progress: 0,
            objectUrl: URL.createObjectURL(file),
            file,
        }));
        set((state) => ({ queue: [...state.queue, ...items] }));

        return items.map((item) => item.id);
    },
    startUpload: (id, expiration, password) => {
        const item = get().queue.find((entry) => entry.id === id);

        if (!item?.file || ['uploading', 'done'].includes(item.status)) {
            return;
        }

        const patch = (changes: Partial<UploadItem>) =>
            set((state) => ({
                queue: state.queue.map((entry) =>
                    entry.id === id ? { ...entry, ...changes } : entry,
                ),
            }));
        const fail = (failure: UploadFailure, note: string) =>
            patch({
                status: 'failed',
                progress: 0,
                failure,
                failureNote: note,
            });

        if (get().uploadFault === 'offline') {
            return fail(
                'network',
                'The connection dropped. Nothing was stored.',
            );
        }

        patch({
            status: 'uploading',
            progress: 0,
            failure: undefined,
            failureNote: undefined,
        });
        const form = new FormData();
        form.append('file', item.file);
        form.append('expiration', expiration);

        if (password) {
            form.append('password', password);
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/shares/files');
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('X-CSRF-TOKEN', csrfToken());
        xhr.upload.onprogress = (event) =>
            event.lengthComputable &&
            patch({ progress: Math.round((event.loaded / event.total) * 100) });
        xhr.onerror = () => fail('network', 'The upload was interrupted.');
        xhr.onload = () => {
            if (xhr.status < 200 || xhr.status >= 300) {
                const payload = JSON.parse(xhr.responseText || '{}') as {
                    message?: string;
                    errors?: Record<string, string[]>;
                };
                fail(
                    xhr.status === 422 ? 'type' : 'network',
                    Object.values(payload.errors ?? {})[0]?.[0] ??
                        payload.message ??
                        'The upload failed.',
                );

                return;
            }

            const response = JSON.parse(
                xhr.responseText,
            ) as ResourceResponse<FileShare>;
            set((state) => ({
                shares: [response.data, ...state.shares],
                queue: state.queue.map((entry) =>
                    entry.id === id
                        ? {
                              ...entry,
                              status: 'done',
                              progress: 100,
                              shareId: response.data.id,
                          }
                        : entry,
                ),
            }));
        };
        xhr.send(form);
    },
    retryUpload: (id, expiration, password) => {
        set((state) => ({
            queue: state.queue.map((entry) =>
                entry.id === id
                    ? {
                          ...entry,
                          status: 'queued',
                          progress: 0,
                          failure: undefined,
                      }
                    : entry,
            ),
        }));
        get().startUpload(id, expiration, password);
    },
    removeUpload: (id) =>
        set((state) => ({
            queue: state.queue.map((entry) =>
                entry.id === id ? { ...entry, status: 'removed' } : entry,
            ),
        })),
    clearQueue: () => set({ queue: [] }),
    createPaste: async (input) => {
        const response = await requestJson<ResourceResponse<PasteShare>>(
            '/shares/pastes',
            {
                method: 'POST',
                body: JSON.stringify({
                    body: input.body,
                    paste_type: input.pasteType,
                    language: input.language,
                    expiration: input.expiration,
                    password: input.password,
                }),
            },
        );
        set((state) => ({ shares: [response.data, ...state.shares] }));

        return response.data;
    },
    findShare: (id) => get().shares.find((share) => share.id === id),
    deleteShares: (ids) => {
        set((state) => ({
            shares: state.shares.filter((share) => !ids.includes(share.id)),
        }));
        void requestJson('/shares', {
            method: 'DELETE',
            body: JSON.stringify({ ids }),
        }).catch((error) => toast.error(firstApiError(error)));
    },
    unlock: async (id, password) => {
        try {
            await requestJson(`/shares/${id}/unlock`, {
                method: 'POST',
                body: JSON.stringify({ password }),
            });
            set((state) => ({
                unlocked: [...new Set([...state.unlocked, id])],
            }));
            router.reload({ only: ['state'] });

            return true;
        } catch {
            return false;
        }
    },
    registerView: () => undefined,
    updateProfile: (profile) => {
        const id = get().currentAccountId;
        set((state) => ({
            accounts: patchAccount(state.accounts, id, (account) => ({
                ...account,
                ...profile,
            })),
        }));
        const payload = {
            ...profile,
            default_expiration: profile.defaultExpiration,
        };
        delete payload.defaultExpiration;
        void requestJson('/profile', {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }).catch((error) => toast.error(firstApiError(error)));
    },
    updateAvatar: (file) => {
        const form = new FormData();
        form.append('_method', 'PATCH');

        if (file === null) {
            form.append('remove_avatar', '1');
        } else {
            form.append('avatar', file);
        }

        void requestJson<ResourceResponse<Account>>('/profile', {
            method: 'POST',
            body: form,
        })
            .then((response) =>
                set((state) => ({
                    accounts: patchAccount(
                        state.accounts,
                        state.currentAccountId,
                        () => response.data,
                    ),
                })),
            )
            .catch((error) => toast.error(firstApiError(error)));
    },
    createToken: (name) => {
        void requestJson<ResourceResponse<Account['tokens'][number]>>(
            '/api-tokens',
            { method: 'POST', body: JSON.stringify({ name }) },
        )
            .then((response) =>
                set((state) => ({
                    accounts: patchAccount(
                        state.accounts,
                        state.currentAccountId,
                        (account) => ({
                            ...account,
                            tokens: [response.data, ...account.tokens],
                        }),
                    ),
                })),
            )
            .catch((error) => toast.error(firstApiError(error)));
    },
    revokeToken: (id) =>
        get().revokeUserToken(get().currentAccountId ?? '', id),
    dismissTokenSecret: (id) =>
        set((state) => ({
            accounts: patchAccount(
                state.accounts,
                state.currentAccountId,
                (account) => ({
                    ...account,
                    tokens: account.tokens.map((token) =>
                        token.id === id
                            ? { ...token, justCreated: false }
                            : token,
                    ),
                }),
            ),
        })),
    endLoginSession: (id) =>
        get().endUserSession(get().currentAccountId ?? '', id),
    deleteAccount: () => {
        void requestJson('/profile', { method: 'DELETE' })
            .then(() => router.visit('/'))
            .catch((error) => toast.error(firstApiError(error)));
    },
    fillStorage: () =>
        set((state) => ({
            accounts: patchAccount(
                state.accounts,
                state.currentAccountId,
                (account) => ({
                    ...account,
                    storageUsed: Math.round(account.storageLimit * 0.998),
                }),
            ),
        })),

    createTransfer: async () => {
        const response = await requestJson<ResourceResponse<TransferSession>>(
            '/transfers',
            { method: 'POST' },
        );
        set({ transfer: response.data });

        return response.data;
    },
    joinTransfer: async (raw) => {
        try {
            const response = await requestJson<
                ResourceResponse<TransferSession>
            >('/transfers/join', {
                method: 'POST',
                body: JSON.stringify({ code: raw.trim().toUpperCase() }),
            });
            set({ transfer: response.data });

            return { ok: true };
        } catch (error) {
            return {
                ok: false,
                reason: firstApiError(error).toLowerCase().includes('expired')
                    ? 'expired'
                    : 'invalid',
            };
        }
    },
    leaveTransfer: () => {
        const transfer = get().transfer;

        if (!transfer) {
            return;
        }

        set({ transfer: { ...transfer, leftLocally: true } });
        void requestJson(`/transfers/${transfer.code}/leave`, {
            method: 'DELETE',
        }).catch((error) => toast.error(firstApiError(error)));
    },
    addTransferItems: (items) => {
        const transfer = get().transfer;

        if (!transfer) {
            return;
        }

        for (const item of items) {
            const form = new FormData();

            if (item.file) {
                form.append('file', item.file);
            } else if (item.body) {
                form.append('body', item.body);
            }

            void requestJson<ResourceResponse<TransferItem>>(
                `/transfers/${transfer.code}/items`,
                { method: 'POST', body: form },
            )
                .then((response) =>
                    set((state) =>
                        state.transfer
                            ? {
                                  transfer: {
                                      ...state.transfer,
                                      items: [
                                          response.data,
                                          ...state.transfer.items,
                                      ],
                                      lastActivityAt: Date.now(),
                                  },
                              }
                            : state,
                    ),
                )
                .catch((error) => toast.error(firstApiError(error)));
        }
    },
    deleteTransferItem: (id) => {
        const transfer = get().transfer;

        if (!transfer) {
            return;
        }

        set({
            transfer: {
                ...transfer,
                items: transfer.items.filter((item) => item.id !== id),
                lastActivityAt: Date.now(),
            },
        });
        void requestJson(`/transfers/${transfer.code}/items/${id}`, {
            method: 'DELETE',
        }).catch((error) => toast.error(firstApiError(error)));
    },
    touchTransfer: (note) => {
        const transfer = get().transfer;

        if (!transfer) {
            return;
        }

        set({ transfer: { ...transfer, lastActivityAt: Date.now() } });
        void requestJson(`/transfers/${transfer.code}/touch`, {
            method: 'POST',
            body: JSON.stringify({ note }),
        }).catch(() => undefined);
    },
    ageTransfer: (ms) =>
        set((state) =>
            state.transfer
                ? {
                      transfer: {
                          ...state.transfer,
                          lastActivityAt: state.transfer.lastActivityAt - ms,
                      },
                  }
                : state,
        ),
    endTransferSession: (code) => {
        set((state) => ({
            transferHistory: state.transferHistory.map((session) =>
                session.code === code
                    ? { ...session, expired: true, items: [] }
                    : session,
            ),
        }));
        void requestJson(`/admin/sessions/${code}`, { method: 'DELETE' }).catch(
            (error) => toast.error(firstApiError(error)),
        );
    },
    deleteTransferSession: (code) => get().endTransferSession(code),
    setAdminDraft: (patch) =>
        set((state) => ({ adminDraft: { ...state.adminDraft, ...patch } })),
    saveAdmin: () => {
        const draft = cloneConfig(get().adminDraft);
        set({ adminConfig: draft });
        void requestJson<ResourceResponse<AdminConfig>>('/admin/settings', {
            method: 'PATCH',
            body: JSON.stringify(draft),
        }).catch((error) => toast.error(firstApiError(error)));
    },
    resetAdmin: () =>
        set((state) => ({ adminDraft: cloneConfig(state.adminConfig) })),
    resetDemo: () => router.reload(),
}));

export function isShareExpired(share: Share, now = Date.now()): boolean {
    return share.expiresAt !== null && share.expiresAt <= now;
}

export function mergeTransfers(
    live: TransferSession | null,
    history: TransferSession[],
): TransferSession[] {
    if (!live) {
        return history;
    }

    return [live, ...history.filter((session) => session.code !== live.code)];
}

export function transferExpiresAt(
    session: TransferSession,
    windowMs: number,
): number {
    return session.lastActivityAt + windowMs;
}

export function isTransferExpired(
    session: TransferSession,
    windowMs: number,
    now = Date.now(),
): boolean {
    return session.expired || now >= transferExpiresAt(session, windowMs);
}

export { EXPIRATION_MS };
