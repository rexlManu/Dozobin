import { LANGUAGES, fileCategory } from './detect';
import type { FileCategory } from './detect';
import type { Share } from './types';

/**
 * How a Share presents itself in a list. Shared by the member Library and the
 * administrator's global uploads table so the two never drift apart.
 */

/** A Paste has no title, so its first meaningful line stands in for one. */
export function pasteSnippet(body: string): string {
    const line =
        body.split('\n').find((value) => value.trim().length > 0) ?? '';

    return (
        line
            .replace(/^#+\s*/, '')
            .trim()
            .slice(0, 90) || 'Empty paste'
    );
}

export function shareLabel(share: Share): string {
    return share.kind === 'file' ? share.filename : pasteSnippet(share.body);
}

export function shareSize(share: Share): number {
    return share.kind === 'file'
        ? share.size
        : new TextEncoder().encode(share.body).length;
}

export function typeChip(share: Share): string {
    if (share.kind === 'file') {
        return share.mime.split('/')[1]?.toUpperCase() ?? 'FILE';
    }

    if (share.pasteType === 'markdown') {
        return 'MARKDOWN';
    }

    if (share.pasteType === 'code') {
        return (
            LANGUAGES.find((l) => l.id === share.language)?.label ?? 'CODE'
        ).toUpperCase();
    }

    return 'TEXT';
}

export function sharePath(share: Share): string {
    return `${share.kind === 'file' ? '/s/' : '/p/'}${share.id}`;
}

/** A Paste is its own kind of thing, so it sits alongside the file buckets. */
export type Category = FileCategory | 'paste';

export const CATEGORY_LABEL: Record<Category, string> = {
    image: 'Images',
    video: 'Video',
    audio: 'Audio',
    document: 'Documents',
    archive: 'Archives',
    paste: 'Pastes',
    other: 'Other',
};

export const CATEGORY_ORDER: Category[] = [
    'image',
    'video',
    'audio',
    'document',
    'archive',
    'paste',
    'other',
];

export function shareCategory(share: Share): Category {
    return share.kind === 'paste'
        ? 'paste'
        : fileCategory(share.mime, share.filename);
}

/**
 * What an owner's files actually add up to. Only stored files count: a Paste
 * lives in the record itself and never occupied a byte of the quota.
 */
export function usageFromShares(shares: Share[], ownerId: string): number {
    return shares.reduce(
        (sum, share) =>
            share.kind === 'file' && share.ownerId === ownerId
                ? sum + share.size
                : sum,
        0,
    );
}

export function countSharesByOwner(shares: Share[]): Record<string, number> {
    const tally: Record<string, number> = {};

    for (const share of shares) {
        const key = share.ownerId ?? '__guest';
        tally[key] = (tally[key] ?? 0) + 1;
    }

    return tally;
}
