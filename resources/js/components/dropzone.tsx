import { UploadSimple } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * The drop target inside the Send card. The whole window also accepts a drop,
 * because people throw files at the window, not at a rectangle; the zone lights
 * up while a drag is anywhere over the page.
 */
export function DropZone({
    onFiles,
    hint,
}: {
    onFiles: (files: File[]) => void;
    /** One quiet line under the button: limits and the clipboard tip. */
    hint: React.ReactNode;
}) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const onFilesRef = useRef(onFiles);

    useEffect(() => {
        onFilesRef.current = onFiles;
    }, [onFiles]);

    useEffect(() => {
        let depth = 0;
        const hasFiles = (event: DragEvent) =>
            Array.from(event.dataTransfer?.types ?? []).includes('Files');
        const enter = (event: DragEvent) => {
            if (!hasFiles(event)) {
                return;
            }

            depth += 1;
            setDragging(true);
        };
        const leave = () => {
            depth = Math.max(0, depth - 1);

            if (depth === 0) {
                setDragging(false);
            }
        };
        const over = (event: DragEvent) => {
            if (hasFiles(event)) {
                event.preventDefault();
            }
        };
        const drop = (event: DragEvent) => {
            if (!hasFiles(event)) {
                return;
            }

            event.preventDefault();
            depth = 0;
            setDragging(false);
            const files = Array.from(event.dataTransfer?.files ?? []);

            if (files.length > 0) {
                onFilesRef.current(files);
            }
        };

        window.addEventListener('dragenter', enter);
        window.addEventListener('dragleave', leave);
        window.addEventListener('dragover', over);
        window.addEventListener('drop', drop);

        return () => {
            window.removeEventListener('dragenter', enter);
            window.removeEventListener('dragleave', leave);
            window.removeEventListener('dragover', over);
            window.removeEventListener('drop', drop);
        };
    }, []);

    return (
        <div
            className={cn(
                'grid min-h-[250px] place-content-center justify-items-center gap-2.5 rounded-[24px] border-[2.5px] border-dashed px-6 py-8 text-center transition-[border-color,background-color,transform] duration-200 ease-bounce',
                dragging
                    ? 'scale-[1.01] border-primary bg-primary-soft'
                    : 'border-border-strong bg-[radial-gradient(circle_at_50%_120%,rgb(185_168_255/0.1),transparent_60%)]',
            )}
        >
            <p className="text-[28px] leading-tight font-bold sm:text-[30px]">
                {dragging ? 'Let go to send them' : 'Drop files here'}
            </p>
            <span className="text-muted-foreground">or</span>
            <Button
                type="button"
                size="lg"
                onClick={() => inputRef.current?.click()}
            >
                <UploadSimple weight="bold" /> Choose files
            </Button>
            <p className="max-w-[48ch] text-[13px] text-muted-foreground">
                {hint}
            </p>
            <input
                ref={inputRef}
                type="file"
                multiple
                className="sr-only"
                tabIndex={-1}
                onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);

                    if (files.length > 0) {
                        onFiles(files);
                    }

                    event.target.value = '';
                }}
            />
        </div>
    );
}
