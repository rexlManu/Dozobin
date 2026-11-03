import { useEffect, useRef, useState } from 'react';
import { paintCity, paintSky } from '@/lib/night-paint';
import { cn } from '@/lib/utils';

type Painter = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
) => void;

/**
 * A canvas that fills its box and paints `paint` once. It paints again only
 * after the box changes size (debounced), never per frame. Height changes
 * smaller than `heightSlack` are ignored, so a phone's address bar showing
 * and hiding does not repaint.
 */
function PaintedCanvas({
    paint,
    heightSlack = 0,
    className,
}: {
    paint: Painter;
    heightSlack?: number;
    className?: string;
}) {
    const ref = useRef<HTMLCanvasElement>(null);
    const [painted, setPainted] = useState(false);

    useEffect(() => {
        const canvas = ref.current;

        if (!canvas) {
            return;
        }

        let last = { width: 0, height: 0 };
        let timer: number | undefined;

        const draw = () => {
            const { width, height } = canvas.getBoundingClientRect();

            if (
                width === 0 ||
                height === 0 ||
                (Math.abs(width - last.width) < 1 &&
                    Math.abs(height - last.height) <= heightSlack)
            ) {
                return;
            }

            const ctx = canvas.getContext('2d');

            if (!ctx) {
                return;
            }

            last = { width, height };
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
            paint(ctx, width, height);
            setPainted(true);
        };

        const observer = new ResizeObserver(() => {
            window.clearTimeout(timer);
            timer = window.setTimeout(draw, last.width === 0 ? 0 : 150);
        });
        observer.observe(canvas);

        return () => {
            observer.disconnect();
            window.clearTimeout(timer);
        };
    }, [paint, heightSlack]);

    return (
        <canvas
            ref={ref}
            aria-hidden
            className={cn(
                'block size-full transition-opacity duration-500',
                painted ? 'opacity-100' : 'opacity-0',
                className,
            )}
        />
    );
}

/**
 * The Long night sky: a painted canvas fixed to the window, behind the whole
 * page. A CSS gradient in the same colours shows until the canvas is ready.
 * Put it first inside a `relative isolate` page frame.
 */
export function NightSky() {
    return (
        <div
            aria-hidden
            className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-lvh bg-linear-to-b from-[#03040f] via-[#18134a] via-70% to-[#4b3478]"
        >
            <PaintedCanvas paint={paintSky} heightSlack={160} />
        </div>
    );
}

/**
 * The painted city that ends every page, 220px on a phone and 260px from
 * `sm`. Put it last in the page frame, in flow, so content never covers it.
 */
export function NightCity() {
    return (
        <div
            aria-hidden
            className="pointer-events-none relative h-[220px] shrink-0 sm:h-[260px]"
        >
            <PaintedCanvas paint={paintCity} />
        </div>
    );
}

/** The four-point sparkle that marks a device as online. */
export function Sparkle({ className }: { className?: string }) {
    return (
        <svg
            aria-hidden
            viewBox="-12 -12 24 24"
            className={cn('size-3.5 shrink-0', className)}
        >
            <path
                d="M0 -10q2 8 10 10q-8 2-10 10q-2-8-10-10q8-2 10-10z"
                fill="#fff4d2"
            />
        </svg>
    );
}
