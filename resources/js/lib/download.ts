import { toast } from 'sonner';

function saveBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function downloadText(text: string, filename: string) {
    saveBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), filename);
}

/**
 * Real download when there are real bytes. Seeded samples say so instead of
 * handing over an empty file with a convincing name.
 */
export async function downloadSource(
    src: string | undefined,
    filename: string,
) {
    if (!src) {
        toast('Nothing to download', {
            description:
                'This is a seeded sample with no file behind it. Upload a real file to get a working download.',
        });

        return;
    }

    try {
        const response = await fetch(src);

        if (!response.ok) {
            throw new Error(String(response.status));
        }

        saveBlob(await response.blob(), filename);
    } catch {
        window.open(src, '_blank', 'noopener');
    }
}
