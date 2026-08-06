import { FolderOpen } from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * The brand mark at display scale: one square handing off to another. Dragging
 * completes the handoff, so the window's single authored motion is the
 * product's single act. Kept to two primitives, like the 16px original.
 */
function DropMark({ landing }: { landing: boolean }) {
    return (
        <svg
            viewBox="0 0 48 48"
            aria-hidden
            className="size-[72px] overflow-visible"
        >
            <rect
                x="1.25"
                y="1.25"
                width="31.5"
                height="31.5"
                rx="6.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                className={cn(
                    'transition-opacity duration-300 ease-out',
                    landing ? 'opacity-80' : 'opacity-45',
                )}
            />
            <rect
                x="15.5"
                y="15.5"
                width="31.5"
                height="31.5"
                rx="6.5"
                className="fill-primary transition-transform duration-300 ease-out"
                style={{
                    transform: landing ? 'translate(-7px, -7px)' : 'none',
                }}
            />
        </svg>
    );
}

/**
 * The window is the drop target. There is no box to aim at, because people
 * already throw files at the window rather than at a rectangle inside it.
 *
 * `tray` and `bar` sit inside the same drag surface, so a file dropped on the
 * queue or on the controls still lands.
 */
export function DropCanvas({
    onFiles,
    tray,
    bar,
    idle,
}: {
    onFiles: (files: File[]) => void;
    tray?: React.ReactNode;
    bar?: React.ReactNode;
    /**
     * Nothing is queued yet, so the picker keeps the accent. Once a tray exists,
     * uploading it is the primary act and the picker steps back to let it hold
     * the one accent the system allows per screen.
     */
    idle?: boolean;
}) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div
            onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
            }}
            onDragLeave={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node)) {
                    return;
                }

                setDragging(false);
            }}
            onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const files = Array.from(event.dataTransfer.files);

                if (files.length > 0) {
                    onFiles(files);
                }
            }}
            className={cn(
                'relative flex h-full flex-col transition-colors duration-150',
                dragging ? 'bg-primary-soft/50' : 'bg-sunken',
            )}
        >
            {/* A rule inset from every edge, so the whole window reads as the target. */}
            <span
                aria-hidden
                className={cn(
                    'pointer-events-none absolute inset-3 z-10 rounded-lg border-2 border-dashed transition-colors duration-150',
                    dragging ? 'border-primary/70' : 'border-transparent',
                )}
            />

            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
                <DropMark landing={dragging} />

                <div className="flex flex-col items-center gap-2.5">
                    <p className="text-balance text-[30px] font-medium leading-[1.1] tracking-[-0.025em] sm:text-[38px]">
                        {dragging ? 'Let go to add them' : 'Drop files here'}
                    </p>
                    <p className="text-muted-foreground max-w-[46ch] text-[13.5px] leading-relaxed">
                        Every file becomes its own share with its own URL.
                        Nothing is bundled, zipped, or grouped.
                    </p>
                </div>

                <Button
                    type="button"
                    size="lg"
                    variant={idle ? 'default' : 'outline'}
                    onClick={() => inputRef.current?.click()}
                >
                    <FolderOpen /> Choose files
                </Button>
            </div>

            {tray}
            {bar}

            <input
                ref={inputRef}
                type="file"
                multiple
                className="sr-only"
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
