import { useId } from 'react';
import { cn } from '@/lib/utils';

type Star = {
    x: number;
    y: number;
    sparkle: boolean;
    radius: number;
    opacity: number;
};

/** Deterministic star positions (a small linear congruential generator), so every render matches. */
export function starField(
    count: number,
    width: number,
    height: number,
    seed: number,
): Star[] {
    const stars: Star[] = [];
    let state = seed;
    const next = () => {
        state = (state * 16807) % 2147483647;

        return state / 2147483647;
    };

    for (let index = 0; index < count; index++) {
        const x = next() * width;
        const y = next() * height * 0.8;
        const sparkle = next() > 0.9;
        stars.push({
            x,
            y,
            sparkle,
            radius: sparkle ? 0 : next() * 1.2 + 0.4,
            opacity: sparkle ? 0.9 : next() * 0.6 + 0.3,
        });
    }

    return stars;
}

export function Stars({
    count,
    width,
    height,
    seed = 3,
}: {
    count: number;
    width: number;
    height: number;
    seed?: number;
}) {
    return (
        <>
            {starField(count, width, height, seed).map((star, index) =>
                star.sparkle ? (
                    <path
                        key={index}
                        d={`M${star.x} ${star.y - 5}q1 4 5 5q-4 1-5 5q-1-4-5-5q4-1 5-5z`}
                        fill="#fff7d6"
                        opacity={star.opacity}
                    />
                ) : (
                    <circle
                        key={index}
                        cx={star.x.toFixed(1)}
                        cy={star.y.toFixed(1)}
                        r={star.radius.toFixed(2)}
                        fill="#fff"
                        opacity={star.opacity.toFixed(2)}
                    />
                ),
            )}
        </>
    );
}

const WINDOWS = [
    [78, 286],
    [150, 266],
    [168, 284],
    [302, 272],
    [420, 292],
    [560, 260],
    [574, 278],
    [702, 302],
    [884, 266],
    [900, 286],
    [1046, 300],
    [1200, 292],
    [1314, 290],
    [1330, 306],
] as const;

/**
 * The drawn night sky over low rooftops. AppShell puts it behind the top of
 * every page. It always renders at the full height of its box and never
 * scales with the width: the city repeats to both sides instead, so the
 * rooftops sit at the same height on a phone and on a wide screen. Static on
 * purpose: nothing in it animates.
 */
export function NightSky({
    className,
    sky = true,
}: {
    className?: string;
    /** False draws only the rooftops, clouds and windows, on a clear background. */
    sky?: boolean;
}) {
    const id = useId();

    return (
        <svg
            aria-hidden
            viewBox="-1440 0 4320 380"
            className={cn(
                'absolute bottom-0 left-1/2 aspect-[4320/380] h-full max-w-none -translate-x-1/2',
                className,
            )}
        >
            <defs>
                <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#05061a" />
                    <stop offset=".55" stopColor="#1a1650" />
                    <stop offset=".85" stopColor="#3b2a6e" />
                    <stop offset="1" stopColor="#5a3a7a" />
                </linearGradient>
                <radialGradient id={`${id}-glow`} cx=".5" cy=".5" r=".5">
                    <stop offset="0" stopColor="#fff2c8" stopOpacity=".35" />
                    <stop offset="1" stopColor="#fff2c8" stopOpacity="0" />
                </radialGradient>
                <g id={`${id}-city`}>
                    <g fill="#b9a8ff" opacity=".22">
                        <path d="M120 250q30-40 80-24q20-30 64-14q40-6 50 30q30 8 18 34H110q-22-10 10-26z" />
                        <path d="M860 214q24-30 64-18q18-22 52-10q34-4 40 22q24 8 14 26H852q-18-8 8-20z" />
                    </g>
                    <path
                        d="M420 290q40-46 100-26q30-30 80-12q50-4 60 34q36 10 22 40H410q-30-12 10-36z"
                        fill="#ffc4d6"
                        opacity=".16"
                    />
                    <path
                        d="M0 380V300h60v-26h40v26h30v-48h56v48h24v-20h44v20h60v-36h38v-22h30v58h50v-30h70v30h40v-62h52v62h36v-24h48v24h56v-40h30v-18h44v58h52v-30h60v30h40v-50h50v50h36v-22h52v22h44v-34h40v34h50v-26h60V380z"
                        fill="#0a0716"
                    />
                    <path
                        d="M1280 380v-72h46v-28h40v28h74v72z"
                        fill="#0a0716"
                    />
                    <g fill="#ffd98a">
                        {WINDOWS.map(([x, y]) => (
                            <rect
                                key={`${x}-${y}`}
                                x={x}
                                y={y}
                                width="7"
                                height="9"
                                rx="1.5"
                                opacity=".85"
                            />
                        ))}
                    </g>
                </g>
            </defs>
            {sky && (
                <>
                    <rect
                        x="-1440"
                        width="4320"
                        height="380"
                        fill={`url(#${id}-sky)`}
                    />
                    <g transform="translate(-1440 0)">
                        <Stars count={420} width={4320} height={300} />
                    </g>
                    <circle
                        cx="1180"
                        cy="92"
                        r="90"
                        fill={`url(#${id}-glow)`}
                    />
                    <path
                        d="M1196 58a40 40 0 1 0 22 62a34 34 0 1 1-22-62z"
                        fill="#fff4d2"
                    />
                </>
            )}
            <use href={`#${id}-city`} x="-1440" />
            <use href={`#${id}-city`} />
            <use href={`#${id}-city`} x="1440" />
        </svg>
    );
}

/**
 * The night sky band behind the top of a page: 300px on a phone, 340px from
 * `sm`, fading into the black ground. Put it first inside a `relative isolate`
 * page frame.
 */
export function SkyBackdrop({ fade = true }: { fade?: boolean }) {
    return (
        <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[300px] overflow-hidden sm:h-[340px]"
        >
            <NightSky />
            {fade && (
                <span className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-b from-transparent to-background" />
            )}
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
