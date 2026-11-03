import { useSyncExternalStore } from 'react';
import { NightSky, SkyBackdrop, starField } from '@/components/night-sky';
import { cn } from '@/lib/utils';

/*
  TRIAL: four candidate page backgrounds, switchable at runtime so the owner
  can compare them on real pages. Once one is picked, the others and the
  switcher go away.
*/

export const BACKDROPS = {
    harbor: 'Harbor',
    'long-night': 'Long night',
    dusk: 'Dusk',
    sakura: 'Sakura',
} as const;

export type BackdropName = keyof typeof BACKDROPS;

const STORAGE_KEY = 'dozobin.backdrop';
const DEFAULT: BackdropName = 'harbor';
const listeners = new Set<() => void>();

function isBackdrop(value: string | null): value is BackdropName {
    return value !== null && value in BACKDROPS;
}

function readBackdrop(): BackdropName {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);

        return isBackdrop(stored) ? stored : DEFAULT;
    } catch {
        return DEFAULT;
    }
}

export function setBackdrop(name: BackdropName) {
    try {
        window.localStorage.setItem(STORAGE_KEY, name);
    } catch {
        // Private windows can refuse storage. The choice then lasts one page.
    }

    listeners.forEach((listener) => listener());
}

/** The current trial backdrop. `?bg=<name>` in the URL also selects one. */
export function useBackdrop(): BackdropName {
    return useSyncExternalStore(
        (onChange) => {
            const fromUrl = new URLSearchParams(window.location.search).get(
                'bg',
            );

            if (isBackdrop(fromUrl) && fromUrl !== readBackdrop()) {
                setBackdrop(fromUrl);
            }

            listeners.add(onChange);

            return () => listeners.delete(onChange);
        },
        readBackdrop,
        () => DEFAULT,
    );
}

/** A square SVG tile of stars as a CSS `url()`, for repeating backgrounds. */
function starTile(size: number, count: number, seed: number): string {
    const marks = starField(count, size, size / 0.8, seed)
        .map((star) =>
            star.sparkle
                ? `<path d="M${star.x} ${star.y - 4}q.8 3.2 4 4q-3.2.8-4 4q-.8-3.2-4-4q3.2-.8 4-4z" fill="#fff7d6" opacity=".8"/>`
                : `<circle cx="${star.x.toFixed(1)}" cy="${star.y.toFixed(1)}" r="${star.radius.toFixed(2)}" fill="#fff" opacity="${star.opacity.toFixed(2)}"/>`,
        )
        .join('');

    return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${marks}</svg>`)}")`;
}

/** Loose sakura petals at rest, as a repeating CSS `url()` tile. */
function petalTile(size: number, count: number, seed: number): string {
    const marks = starField(count, size, size / 0.8, seed)
        .map((petal, index) => {
            const angle = Math.round(petal.opacity * 720) % 360;
            const scale = (0.7 + petal.radius * 0.45).toFixed(2);
            const fill = index % 3 === 0 ? '#ffc4d6' : '#ffb3c7';

            return `<path transform="translate(${petal.x.toFixed(1)} ${petal.y.toFixed(1)}) rotate(${angle}) scale(${scale})" d="M0-7C5-7 7-1 0 7C-7-1-5-7-1.2-7L0-4.6z" fill="${fill}" opacity="${(0.25 + petal.opacity * 0.35).toFixed(2)}"/>`;
        })
        .join('');

    return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${marks}</svg>`)}")`;
}

const STARS = `${starTile(620, 60, 7)}, ${starTile(940, 50, 19)}`;
const PETALS = `${petalTile(640, 11, 23)}, ${petalTile(980, 9, 31)}`;

function Moon({ className }: { className?: string }) {
    return (
        <svg aria-hidden viewBox="0 0 200 200" className={className}>
            <defs>
                <radialGradient id="trial-moon-glow" cx=".5" cy=".5" r=".5">
                    <stop offset="0" stopColor="#fff2c8" stopOpacity=".35" />
                    <stop offset="1" stopColor="#fff2c8" stopOpacity="0" />
                </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="90" fill="url(#trial-moon-glow)" />
            <path
                d="M116 66a40 40 0 1 0 22 62a34 34 0 1 1-22-62z"
                fill="#fff4d2"
            />
        </svg>
    );
}

/** Deterministic reflection streaks for the Harbor water, one 1440-wide city tile. */
function reflections() {
    let state = 41;
    const next = () => {
        state = (state * 16807) % 2147483647;

        return state / 2147483647;
    };
    const streaks: { x: number; y: number; w: number; o: number; c: string }[] =
        [];

    // The moon's path on the water.
    for (let y = 10; y < 420; y += 15) {
        const w = (64 - y * 0.1) * (0.5 + next() * 0.6);
        streaks.push({
            x: 1180 - w / 2 + (next() - 0.5) * 14,
            y,
            w,
            o: 0.34 * (1 - y / 440),
            c: '#fff4d2',
        });
    }

    // A few faint ripples across the bay.
    for (let index = 0; index < 26; index++) {
        const y = 20 + next() * 520;
        streaks.push({
            x: next() * 1440,
            y,
            w: 40 + next() * 120,
            o: 0.07 * (1 - y / 600),
            c: '#b9a8ff',
        });
    }

    return streaks;
}

const STREAKS = reflections();

function HarborWater() {
    return (
        <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-[300px] -z-10 h-[474px] overflow-hidden bg-linear-to-b from-[#0a0716] via-[#171140] via-[6%] to-background sm:top-[340px] sm:h-[537px]"
        >
            <svg
                viewBox="-1440 0 4320 600"
                className="absolute top-0 left-1/2 aspect-[4320/600] h-full max-w-none -translate-x-1/2"
            >
                <defs>
                    <g id="trial-water">
                        {STREAKS.map((streak, index) => (
                            <rect
                                key={index}
                                x={streak.x.toFixed(1)}
                                y={streak.y.toFixed(1)}
                                width={streak.w.toFixed(1)}
                                height="2.2"
                                rx="1.1"
                                fill={streak.c}
                                opacity={streak.o.toFixed(2)}
                            />
                        ))}
                    </g>
                </defs>
                <use href="#trial-water" x="-1440" />
                <use href="#trial-water" />
                <use href="#trial-water" x="1440" />
            </svg>
        </div>
    );
}

function DuskHills() {
    return (
        <svg
            aria-hidden
            viewBox="0 0 1440 220"
            preserveAspectRatio="xMidYMax slice"
            className="absolute inset-x-0 bottom-0 h-[200px] w-full"
        >
            <path
                d="M0 220V112Q180 52 380 104T760 96T1140 84T1440 106V220z"
                fill="#2a1a4e"
            />
            <path
                d="M0 220V168Q240 118 520 158T1000 148T1440 156V220z"
                fill="#120b26"
            />
            <g fill="#120b26">
                <path d="M286 150h30v-12l-15-10l-15 10z" />
                <path d="M326 152h24v-10l-12-8l-12 8z" />
                <path d="M1062 146h34v-14l-17-11l-17 11z" />
                <path d="M1106 148h22v-9l-11-7l-11 7z" />
            </g>
            <g fill="#ffd98a" opacity=".85">
                <rect x="296" y="140" width="6" height="7" rx="1" />
                <rect x="334" y="143" width="5" height="6" rx="1" />
                <rect x="1074" y="136" width="6" height="8" rx="1" />
                <rect x="1084" y="136" width="6" height="8" rx="1" />
            </g>
        </svg>
    );
}

/**
 * The page background behind AppShell. Put it first inside the `relative
 * isolate` page frame; the frame takes `backdropFrame(name)` as its class.
 */
export function PageBackdrop({ name }: { name: BackdropName }) {
    switch (name) {
        case 'harbor':
            return (
                <>
                    <SkyBackdrop fade={false} />
                    <HarborWater />
                </>
            );
        case 'long-night':
            return (
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
                >
                    <span
                        className="absolute inset-0 [mask-image:linear-gradient(#000_40%,transparent_92%)]"
                        style={{ backgroundImage: STARS }}
                    />
                    <Moon className="absolute top-0 left-1/2 size-[200px] translate-x-[300px] max-sm:top-10 max-sm:size-[120px] max-sm:translate-x-[60px]" />
                    <div className="absolute inset-x-0 bottom-0 h-[300px] overflow-hidden sm:h-[340px]">
                        <NightSky sky={false} />
                    </div>
                </div>
            );
        case 'dusk':
            return (
                <div
                    aria-hidden
                    className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-linear-to-b from-[#05061a] via-[#1d1650] via-55% to-[#8a4a86]"
                >
                    <span
                        className="absolute inset-0 [mask-image:linear-gradient(#000_20%,transparent_75%)]"
                        style={{ backgroundImage: STARS }}
                    />
                    <Moon className="absolute top-0 left-1/2 size-[200px] translate-x-[300px] max-sm:top-10 max-sm:size-[120px] max-sm:translate-x-[60px]" />
                    <DuskHills />
                </div>
            );
        case 'sakura':
            return (
                <>
                    <SkyBackdrop />
                    <div
                        aria-hidden
                        className="pointer-events-none fixed inset-0 -z-[5]"
                        style={{
                            backgroundImage: [
                                PETALS,
                                'radial-gradient(60% 50% at 0% 105%, rgb(255 179 199 / 0.13), transparent)',
                                'radial-gradient(50% 45% at 100% 100%, rgb(185 168 255 / 0.1), transparent)',
                            ].join(', '),
                        }}
                    />
                </>
            );
    }
}

/** Ground colour and spacing that go with each backdrop, as classes for the page frame. */
export function backdropFrame(name: BackdropName): string {
    switch (name) {
        case 'harbor':
            return '[--background:#06051a]';
        case 'long-night':
            return '[--background:#0b0926] bg-linear-to-b from-[#05061a] via-[#151140] via-50% to-[#4a3474] pb-[150px] sm:pb-[170px]';
        case 'dusk':
            return '[--background:#0b0926] bg-transparent';
        case 'sakura':
            return '[--background:#0d0a1f]';
    }
}

/** TRIAL: a small switcher in the corner to flip between the backdrops. */
export function BackdropSwitcher({ current }: { current: BackdropName }) {
    return (
        <div className="fixed bottom-24 left-3 z-50 flex gap-1 rounded-[16px] border-[1.5px] border-border-strong bg-popover p-1 md:bottom-4">
            {(Object.keys(BACKDROPS) as BackdropName[]).map((name) => (
                <button
                    key={name}
                    type="button"
                    onClick={() => setBackdrop(name)}
                    className={cn(
                        'rounded-[12px] px-2.5 py-1 text-[12px] font-bold transition-colors',
                        name === current
                            ? 'bg-foreground text-night'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {BACKDROPS[name]}
                </button>
            ))}
        </div>
    );
}
