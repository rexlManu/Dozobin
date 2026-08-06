export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly errors: Record<string, string[]> = {},
    ) {
        super(message);
    }
}

export function csrfToken(): string {
    return (
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? ''
    );
}

export async function requestJson<T>(
    url: string,
    init: RequestInit = {},
): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    headers.set('X-CSRF-TOKEN', csrfToken());

    if (typeof init.body === 'string') {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
        ...init,
        headers,
        credentials: 'same-origin',
    });

    if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
            message?: string;
            errors?: Record<string, string[]>;
        };

        throw new ApiError(
            payload.message ?? 'The request could not be completed.',
            response.status,
            payload.errors,
        );
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

export function firstApiError(error: unknown): string {
    if (error instanceof ApiError) {
        return Object.values(error.errors)[0]?.[0] ?? error.message;
    }

    return error instanceof Error
        ? error.message
        : 'The request could not be completed.';
}
