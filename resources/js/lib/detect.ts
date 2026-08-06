import { fileExtension } from './format';
import type { PasteType } from './types';

export interface LanguageOption {
    id: string;
    label: string;
}

/** Kept deliberately short. These are the grammars the prototype loads. */
export const LANGUAGES: LanguageOption[] = [
    { id: 'typescript', label: 'TypeScript' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'tsx', label: 'TSX' },
    { id: 'python', label: 'Python' },
    { id: 'php', label: 'PHP' },
    { id: 'go', label: 'Go' },
    { id: 'rust', label: 'Rust' },
    { id: 'sql', label: 'SQL' },
    { id: 'bash', label: 'Shell' },
    { id: 'json', label: 'JSON' },
    { id: 'yaml', label: 'YAML' },
    { id: 'html', label: 'HTML' },
    { id: 'css', label: 'CSS' },
    { id: 'diff', label: 'Diff' },
];

export interface Detection {
    type: PasteType;
    language?: string;
    /** Shown next to the override control so the guess is never silent. */
    reason: string;
}

const CODE_SIGNALS: { language: string; label: string; test: RegExp }[] = [
    {
        language: 'json',
        label: 'JSON braces',
        test: /^\s*[[{][\s\S]*[\]}]\s*$/,
    },
    {
        language: 'diff',
        label: 'unified diff header',
        test: /^(diff --git|@@ -\d|\+\+\+ )/m,
    },
    {
        language: 'php',
        label: 'a PHP open tag',
        test: /<\?php|\$this->|namespace\s+App\\/,
    },
    {
        language: 'python',
        label: 'Python def/import',
        test: /^\s*(def |class |from \w+ import |import \w+$)/m,
    },
    {
        language: 'go',
        label: 'a Go package clause',
        test: /^package \w+|func \w+\([^)]*\) \w*\s*\{/m,
    },
    {
        language: 'rust',
        label: 'Rust fn/let syntax',
        test: /\bfn \w+\(|let mut |impl \w+ for /m,
    },
    {
        language: 'sql',
        label: 'SQL keywords',
        test: /\b(select .+ from|insert into|create table|alter table)\b/i,
    },
    {
        language: 'bash',
        label: 'a shebang or shell flags',
        test: /^#!\/(usr\/)?bin\/(env )?(sh|bash|zsh)|^\s*(sudo |docker |systemctl |curl -)/m,
    },
    {
        language: 'yaml',
        label: 'YAML key indentation',
        test: /^[a-z_][\w-]*:\s*$/m,
    },
    {
        language: 'css',
        label: 'CSS declarations',
        test: /^[.#@][\w-]+[^\n]*\{[\s\S]*:[^\n]*;/m,
    },
    {
        language: 'html',
        label: 'HTML tags',
        test: /<\/?(html|div|section|span|p|body|head)\b/i,
    },
    {
        language: 'tsx',
        label: 'JSX with typed props',
        test: /:\s*React\.|<\w+\s+[\w-]+=\{|export default function \w+\(\)\s*\{[\s\S]*return \(/,
    },
    {
        language: 'typescript',
        label: 'TypeScript type syntax',
        test: /\b(interface|type)\s+\w+\s*[=<{]|:\s*(string|number|boolean)\b/,
    },
    {
        language: 'javascript',
        label: 'JS function syntax',
        test: /\b(const|let|function)\b.*(=>|\()/,
    },
];

const MARKDOWN_SIGNALS: { label: string; test: RegExp }[] = [
    { label: 'an ATX heading', test: /^#{1,6}\s+\S/m },
    { label: 'a fenced code block', test: /^```/m },
    { label: 'a list and a link', test: /^[-*+]\s+\S/m },
    { label: 'a table row', test: /^\|.+\|$/m },
    { label: 'a blockquote', test: /^>\s+\S/m },
];

export function detectContent(body: string): Detection {
    const text = body.trim();

    if (!text) {
        return { type: 'text', reason: 'Nothing typed yet' };
    }

    const markdownHits = MARKDOWN_SIGNALS.filter((s) => s.test.test(text));
    const codeHit = CODE_SIGNALS.find((s) => s.test.test(text));

    // A fenced block inside prose is Markdown, but a file that *is* code is code.
    const fencedOnly =
        markdownHits.length === 1 &&
        markdownHits[0].label === 'a fenced code block';

    if (markdownHits.length > 0 && !fencedOnly) {
        return {
            type: 'markdown',
            reason: `Markdown, from ${markdownHits[0].label}`,
        };
    }

    if (codeHit) {
        return {
            type: 'code',
            language: codeHit.language,
            reason: `Source code, from ${codeHit.label}`,
        };
    }

    if (markdownHits.length > 0) {
        return {
            type: 'markdown',
            reason: `Markdown, from ${markdownHits[0].label}`,
        };
    }

    return { type: 'text', reason: 'No code or Markdown markers found' };
}

const IMAGE = /^image\//;
const VIDEO = /^video\//;
const AUDIO = /^audio\//;

export type PreviewKind = 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'none';

export function previewKind(mime: string, filename: string): PreviewKind {
    if (IMAGE.test(mime)) {
        return 'image';
    }

    if (VIDEO.test(mime)) {
        return 'video';
    }

    if (AUDIO.test(mime)) {
        return 'audio';
    }

    if (mime === 'application/pdf' || filename.endsWith('.pdf')) {
        return 'pdf';
    }

    if (mime.startsWith('text/') || /\.(txt|md|log|csv)$/i.test(filename)) {
        return 'text';
    }

    return 'none';
}

/** Extensions the app treats as archives, shared by the glyph and the filter. */
export const ARCHIVE_EXTENSIONS = new Set([
    'zip',
    'gz',
    'tar',
    'tgz',
    '7z',
    'rar',
    'bz2',
    'xz',
]);

export type FileCategory =
    'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';

/**
 * The bucket a file belongs to when someone is looking for "the images" rather
 * than for one filename. Derived from the same signals as the preview, so a
 * thing that previews as an image always filters as one.
 */
export function fileCategory(mime: string, filename: string): FileCategory {
    const kind = previewKind(mime, filename);

    if (kind === 'image') {
        return 'image';
    }

    if (kind === 'video') {
        return 'video';
    }

    if (kind === 'audio') {
        return 'audio';
    }

    // Archives before documents: a .tar.gz reports no preview but is not "other".
    if (ARCHIVE_EXTENSIONS.has(fileExtension(filename))) {
        return 'archive';
    }

    if (kind === 'pdf' || kind === 'text') {
        return 'document';
    }

    return 'other';
}

/** Human label for the mime column. Falls back to the extension. */
export function mimeLabel(mime: string, filename: string): string {
    const known: Record<string, string> = {
        'image/png': 'PNG image',
        'image/jpeg': 'JPEG image',
        'image/webp': 'WebP image',
        'image/gif': 'GIF image',
        'image/svg+xml': 'SVG image',
        'video/mp4': 'MP4 video',
        'video/webm': 'WebM video',
        'audio/wav': 'WAV audio',
        'audio/mpeg': 'MP3 audio',
        'application/pdf': 'PDF document',
        'application/zip': 'ZIP archive',
        'application/x-tar': 'TAR archive',
        'text/plain': 'Plain text',
        'text/markdown': 'Markdown',
        'text/csv': 'CSV',
    };

    if (known[mime]) {
        return known[mime];
    }

    const ext = filename.split('.').pop();

    return ext ? `${ext.toUpperCase()} file` : 'Unknown type';
}

export interface PasteDraft {
    body: string;
    pasteType: PasteType;
    language?: string;
}

/** Folds the detection and the manual override into what actually gets stored. */
export function resolvePaste(
    body: string,
    typeOverride: PasteType | 'auto',
    languageOverride: string | null,
): PasteDraft {
    const detection = detectContent(body);
    const pasteType = typeOverride === 'auto' ? detection.type : typeOverride;

    if (pasteType !== 'code') {
        return { body, pasteType };
    }

    return {
        body,
        pasteType,
        language: languageOverride ?? detection.language ?? 'typescript',
    };
}
