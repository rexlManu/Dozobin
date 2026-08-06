import {
    Archive,
    Code,
    File as FileIcon,
    FileCsv,
    FilePdf,
    Image as ImageIcon,
    MusicNotes,
    TextAlignLeft,
    VideoCamera,
} from '@phosphor-icons/react';
import { ARCHIVE_EXTENSIONS } from '@/lib/detect';
import { fileExtension } from '@/lib/format';
import { cn } from '@/lib/utils';
const CODE = new Set([
    'ts',
    'tsx',
    'js',
    'json',
    'py',
    'php',
    'go',
    'rs',
    'sql',
    'sh',
    'yml',
    'yaml',
    'toml',
]);

export function FileGlyph({
    mime,
    filename,
    className,
}: {
    mime: string;
    filename: string;
    className?: string;
}) {
    const ext = fileExtension(filename);
    const props = {
        className: cn('size-4', className),
        weight: 'regular' as const,
    };

    if (mime.startsWith('image/')) {
        return <ImageIcon {...props} />;
    }

    if (mime.startsWith('video/')) {
        return <VideoCamera {...props} />;
    }

    if (mime.startsWith('audio/')) {
        return <MusicNotes {...props} />;
    }

    if (mime === 'application/pdf') {
        return <FilePdf {...props} />;
    }

    if (mime === 'text/csv' || ext === 'csv') {
        return <FileCsv {...props} />;
    }

    if (ARCHIVE_EXTENSIONS.has(ext)) {
        return <Archive {...props} />;
    }

    if (CODE.has(ext)) {
        return <Code {...props} />;
    }

    if (mime.startsWith('text/')) {
        return <TextAlignLeft {...props} />;
    }

    return <FileIcon {...props} />;
}
