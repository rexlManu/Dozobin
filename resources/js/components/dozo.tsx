import { cn } from '@/lib/utils';

export type DozoMood = 'happy' | 'calm' | 'wow' | 'sleep';

/** Body colors for Dozo. Each Transfer Session device gets its own. */
export const DOZO_COLORS = [
    '#ffd7c2',
    '#c9f0e1',
    '#d9d0ff',
    '#ffe7a8',
    '#ffc9d6',
] as const;

const INK = '#2a2238';

/**
 * Dozo, the Dōzobin mascot: a soft parcel with a sprout. It shows up at moments of
 * welcome, empty states and as the avatar of each device in a Transfer Session.
 * Decorative, so it is hidden from assistive technology.
 */
export function Dozo({
    mood = 'happy',
    body = DOZO_COLORS[0],
    size = 96,
    className,
}: {
    mood?: DozoMood;
    body?: string;
    size?: number;
    className?: string;
}) {
    return (
        <svg
            aria-hidden
            width={size}
            height={size}
            viewBox="0 0 120 120"
            className={cn('shrink-0 overflow-visible', className)}
        >
            <ellipse cx="60" cy="110" rx="34" ry="5" fill={INK} opacity=".18" />
            <path
                d="M60 34c-1-9 3-16 11-19-1 8-5 14-11 19zm0 0c-2-7-7-11-14-11 2 6 7 10 14 11z"
                fill="#8fd6a8"
                stroke={INK}
                strokeWidth="2.6"
                strokeLinejoin="round"
            />
            <rect
                x="40"
                y="99"
                width="12"
                height="9"
                rx="4.5"
                fill={body}
                stroke={INK}
                strokeWidth="3"
            />
            <rect
                x="68"
                y="99"
                width="12"
                height="9"
                rx="4.5"
                fill={body}
                stroke={INK}
                strokeWidth="3"
            />
            <rect
                x="17"
                y="34"
                width="86"
                height="70"
                rx="24"
                fill={body}
                stroke={INK}
                strokeWidth="3.2"
            />
            <path
                d="M53 35.5h14v14.5q-7 3-14 0z"
                fill="#fff3e6"
                stroke={INK}
                strokeWidth="2.4"
                strokeLinejoin="round"
            />
            <path
                d="M25 52q35 6 70 0"
                fill="none"
                stroke={INK}
                strokeWidth="2.2"
                strokeLinecap="round"
                opacity=".35"
            />
            <ellipse
                cx="38"
                cy="80"
                rx="7.5"
                ry="4.5"
                fill="#ff8fab"
                opacity=".7"
            />
            <ellipse
                cx="82"
                cy="80"
                rx="7.5"
                ry="4.5"
                fill="#ff8fab"
                opacity=".7"
            />
            <DozoFace mood={mood} />
        </svg>
    );
}

function DozoFace({ mood }: { mood: DozoMood }) {
    const stroke = {
        fill: 'none',
        stroke: INK,
        strokeLinecap: 'round',
    } as const;

    switch (mood) {
        case 'happy':
            return (
                <>
                    <path
                        d="M43 69q6-7 12 0M65 69q6-7 12 0"
                        {...stroke}
                        strokeWidth="3.6"
                    />
                    <path
                        d="M54 80q3 4 6 0q3 4 6 0"
                        {...stroke}
                        strokeWidth="3"
                        strokeLinejoin="round"
                    />
                </>
            );
        case 'calm':
            return (
                <>
                    <circle cx="49" cy="68" r="4.6" fill={INK} />
                    <circle cx="71" cy="68" r="4.6" fill={INK} />
                    <circle cx="50.6" cy="66.4" r="1.6" fill="#fff" />
                    <circle cx="72.6" cy="66.4" r="1.6" fill="#fff" />
                    <path
                        d="M54 80q3 4 6 0q3 4 6 0"
                        {...stroke}
                        strokeWidth="3"
                        strokeLinejoin="round"
                    />
                </>
            );
        case 'wow':
            return (
                <>
                    <circle cx="49" cy="67" r="5.6" fill={INK} />
                    <circle cx="71" cy="67" r="5.6" fill={INK} />
                    <circle cx="51" cy="65" r="2" fill="#fff" />
                    <circle cx="73" cy="65" r="2" fill="#fff" />
                    <ellipse cx="60" cy="83" rx="3.6" ry="4.4" fill={INK} />
                </>
            );
        case 'sleep':
            return (
                <>
                    <path
                        d="M43 70q6 5 12 0M65 70q6 5 12 0"
                        {...stroke}
                        strokeWidth="3.4"
                    />
                    <path d="M56 83h8" {...stroke} strokeWidth="3" />
                    <text
                        x="92"
                        y="30"
                        fontWeight="700"
                        fontSize="16"
                        fill={INK}
                        opacity=".7"
                    >
                        z
                    </text>
                    <text
                        x="102"
                        y="18"
                        fontWeight="700"
                        fontSize="11"
                        fill={INK}
                        opacity=".5"
                    >
                        z
                    </text>
                </>
            );
    }
}
