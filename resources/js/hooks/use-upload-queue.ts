import { useCallback, useEffect, useRef, useState } from 'react';
import { csrfToken } from '@/lib/api';
import { fileExtension, makeId } from '@/lib/format';
import type {
    ExpirationKey,
    FileShare,
    Share,
    UploadFailure,
    UploadItem,
} from '@/lib/types';

interface ResourceResponse<T> {
    data: T;
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

export function useUploadQueue() {
    const [queue, setQueue] = useState<UploadItem[]>([]);
    const [shares, setShares] = useState<Share[]>([]);
    const queueRef = useRef(queue);

    useEffect(() => {
        queueRef.current = queue;
    }, [queue]);

    const patch = useCallback((id: string, changes: Partial<UploadItem>) => {
        setQueue((current) =>
            current.map((item) =>
                item.id === id ? { ...item, ...changes } : item,
            ),
        );
    }, []);

    const enqueue = useCallback((files: File[]): void => {
        setQueue((current) => [
            ...current,
            ...files.map((file): UploadItem => ({
                id: makeId('up'),
                filename: file.name,
                mime: guessMime(file),
                size: file.size,
                status: 'queued',
                progress: 0,
                objectUrl: URL.createObjectURL(file),
                file,
            })),
        ]);
    }, []);

    const startUpload = useCallback(
        (id: string, expiration: ExpirationKey, password: string | null) => {
            const item = queueRef.current.find((entry) => entry.id === id);

            if (!item?.file || ['uploading', 'done'].includes(item.status)) {
                return;
            }

            const fail = (failure: UploadFailure, note: string) =>
                patch(id, {
                    status: 'failed',
                    progress: 0,
                    failure,
                    failureNote: note,
                });
            const form = new FormData();
            form.append('file', item.file);
            form.append('expiration', expiration);

            if (password) {
                form.append('password', password);
            }

            patch(id, {
                status: 'uploading',
                progress: 0,
                failure: undefined,
                failureNote: undefined,
            });

            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/shares/files');
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.setRequestHeader('X-CSRF-TOKEN', csrfToken());
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    patch(id, {
                        progress: Math.round(
                            (event.loaded / event.total) * 100,
                        ),
                    });
                }
            };
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
                setShares((current) => [response.data, ...current]);
                patch(id, {
                    status: 'done',
                    progress: 100,
                    shareId: response.data.id,
                });
            };
            xhr.send(form);
        },
        [patch],
    );

    const retryUpload = useCallback(
        (id: string, expiration: ExpirationKey, password: string | null) => {
            patch(id, {
                status: 'queued',
                progress: 0,
                failure: undefined,
                failureNote: undefined,
            });
            startUpload(id, expiration, password);
        },
        [patch, startUpload],
    );

    const removeUpload = useCallback(
        (id: string) => patch(id, { status: 'removed' }),
        [patch],
    );

    return {
        queue,
        shares,
        enqueue,
        startUpload,
        retryUpload,
        removeUpload,
        clearQueue: () => setQueue([]),
    };
}
