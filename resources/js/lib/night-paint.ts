/*
  Painters for the Long night art. The app does not run them: render.mjs in
  resources/images/night paints them once into the WebP files the page loads.
  Each one draws a full static picture into a 2D canvas context, in CSS
  pixels (the caller scales for the pixel ratio).
*/

type Random = () => number;

/** A seeded generator, so the same size always paints the same picture. */
function seeded(seed: number): Random {
    let state = seed % 2147483647 || 1;

    return () => {
        state = (state * 16807) % 2147483647;

        return (state - 1) / 2147483646;
    };
}

function between(random: Random, min: number, max: number): number {
    return min + random() * (max - min);
}

/** Roughly normal, centered on 0, mostly within -1..1. */
function bell(random: Random): number {
    return (random() + random() + random() - 1.5) / 1.5;
}

function rgba(rgb: readonly [number, number, number], alpha: number): string {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha.toFixed(3)})`;
}

function softDot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    rgb: readonly [number, number, number],
    alpha: number,
) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, rgba(rgb, alpha));
    glow.addColorStop(1, rgba(rgb, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

const LAVENDER = [185, 168, 255] as const;
const SAKURA = [255, 179, 199] as const;
const MINT = [159, 227, 207] as const;
const MOONLIGHT = [255, 240, 200] as const;
const LAMP = [255, 217, 138] as const;

/** Faint grain over the gradients, so they do not show colour bands. */
function grain(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const tile = document.createElement('canvas');
    tile.width = tile.height = 128;
    const tileCtx = tile.getContext('2d');

    if (!tileCtx) {
        return;
    }

    const random = seeded(99);
    const pixels = tileCtx.createImageData(128, 128);

    for (let index = 0; index < pixels.data.length; index += 4) {
        const light = random() > 0.5 ? 255 : 0;
        pixels.data[index] = light;
        pixels.data[index + 1] = light;
        pixels.data[index + 2] = light;
        pixels.data[index + 3] = random() * 5;
    }

    tileCtx.putImageData(pixels, 0, 0);
    const pattern = ctx.createPattern(tile, 'repeat');

    if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
    }
}

function moon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
) {
    ctx.globalCompositeOperation = 'lighter';
    softDot(ctx, x, y, radius * 16, MOONLIGHT, 0.07);
    softDot(ctx, x, y, radius * 6, MOONLIGHT, 0.16);
    softDot(ctx, x, y, radius * 2.4, MOONLIGHT, 0.18);
    ctx.globalCompositeOperation = 'source-over';

    // The dark part of the disc, faintly lit by the earth.
    ctx.fillStyle = 'rgba(20, 17, 52, 0.14)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // The crescent is painted on its own canvas, then cut with a second disc.
    const size = Math.ceil(radius * 2 + 4);
    // Painted at the device pixel ratio, so the edge stays sharp.
    const scale = ctx.getTransform().a;
    const disc = document.createElement('canvas');
    disc.width = disc.height = Math.ceil(size * scale);
    const discCtx = disc.getContext('2d');

    if (!discCtx) {
        return;
    }

    discCtx.scale(scale, scale);

    const center = size / 2;
    const face = discCtx.createRadialGradient(
        center - radius * 0.35,
        center + radius * 0.1,
        radius * 0.1,
        center,
        center,
        radius,
    );
    face.addColorStop(0, '#fffbef');
    face.addColorStop(0.7, '#fff1cf');
    face.addColorStop(1, '#f6dca4');
    discCtx.fillStyle = face;
    discCtx.beginPath();
    discCtx.arc(center, center, radius, 0, Math.PI * 2);
    discCtx.fill();

    const random = seeded(5);
    discCtx.fillStyle = 'rgba(205, 175, 120, 0.22)';

    for (let index = 0; index < 9; index++) {
        discCtx.beginPath();
        discCtx.arc(
            center + bell(random) * radius * 0.7,
            center + bell(random) * radius * 0.7,
            between(random, 0.05, 0.16) * radius,
            0,
            Math.PI * 2,
        );
        discCtx.fill();
    }

    discCtx.globalCompositeOperation = 'destination-out';
    discCtx.fillStyle = '#000';
    discCtx.beginPath();
    discCtx.arc(
        center + radius * 0.42,
        center - radius * 0.3,
        radius * 0.9,
        0,
        Math.PI * 2,
    );
    discCtx.fill();

    ctx.drawImage(disc, x - center, y - center, size, size);
}

/** A four-point sparkle with a soft glow, the brand's bright star. */
function sparkle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    alpha: number,
) {
    ctx.globalCompositeOperation = 'lighter';
    softDot(ctx, x, y, size * 3, MOONLIGHT, 0.18 * alpha);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(255, 247, 222, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.quadraticCurveTo(x + size * 0.16, y - size * 0.16, x + size, y);
    ctx.quadraticCurveTo(x + size * 0.16, y + size * 0.16, x, y + size);
    ctx.quadraticCurveTo(x - size * 0.16, y + size * 0.16, x - size, y);
    ctx.quadraticCurveTo(x - size * 0.16, y - size * 0.16, x, y - size);
    ctx.fill();
}

const STAR_TINTS = [
    [190, 208, 255],
    [255, 255, 255],
    [255, 255, 255],
    [255, 255, 255],
    [255, 240, 216],
    [255, 222, 230],
] as const;

/**
 * The sky: a deep gradient, a Milky Way band, stars, the moon and low
 * clouds. It is sized to the viewport and stays fixed while the page scrolls.
 */
export function paintSky(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
) {
    const random = seeded(7);
    const span = Math.max(width, height);
    const phone = width < 640;

    const base = ctx.createLinearGradient(0, 0, 0, height);
    base.addColorStop(0, '#03040f');
    base.addColorStop(0.35, '#0a0a29');
    base.addColorStop(0.68, '#18134a');
    base.addColorStop(0.88, '#2f2466');
    base.addColorStop(1, '#4b3478');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    // Warm light from below the horizon.
    ctx.globalCompositeOperation = 'lighter';
    softDot(ctx, width * 0.5, height * 1.08, span * 0.55, SAKURA, 0.12);
    softDot(ctx, width * 0.15, height * 1.02, span * 0.35, LAVENDER, 0.06);

    // The Milky Way: soft coloured haze along a gentle curve, low left to high right.
    const bandAt = (t: number) => ({
        x: -0.1 * width + t * 1.2 * width,
        y: height * (0.7 - t * 0.62) + Math.sin(t * Math.PI) * height * 0.06,
    });
    const bandWidth = Math.min(width, height) * 0.22;
    const slope = Math.atan2(-height * 0.62, width * 1.2);
    const across = { x: -Math.sin(slope), y: Math.cos(slope) };
    const hazeCount = Math.round(170 * (phone ? 0.6 : 1));

    for (let index = 0; index < hazeCount; index++) {
        const point = bandAt(random());
        const offset = bell(random) * bandWidth;
        const pick = random();
        const tint = pick < 0.62 ? LAVENDER : pick < 0.86 ? SAKURA : MINT;
        softDot(
            ctx,
            point.x + across.x * offset,
            point.y + across.y * offset,
            bandWidth * between(random, 0.25, 0.85),
            tint,
            between(random, 0.01, 0.032),
        );
    }

    // Dark dust lanes through the middle of the band.
    ctx.globalCompositeOperation = 'source-over';

    for (let index = 0; index < 70; index++) {
        const point = bandAt(random());
        const offset = bell(random) * bandWidth * 0.35;
        softDot(
            ctx,
            point.x + across.x * offset,
            point.y + across.y * offset,
            bandWidth * between(random, 0.08, 0.26),
            [6, 5, 22],
            between(random, 0.12, 0.3),
        );
    }

    // Fine star dust packed into the band.
    const dustCount = Math.round((width * height) / (phone ? 700 : 420));

    for (let index = 0; index < dustCount; index++) {
        const point = bandAt(random());
        const offset = bell(random) * bandWidth * 0.9;
        ctx.fillStyle = `rgba(255, 250, 255, ${between(random, 0.12, 0.5).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(
            point.x + across.x * offset,
            point.y + across.y * offset,
            between(random, 0.25, 0.7),
            0,
            Math.PI * 2,
        );
        ctx.fill();
    }

    // Field stars, fewer and dimmer toward the horizon.
    const starCount = Math.round((width * height) / 1500);

    for (let index = 0; index < starCount; index++) {
        const x = random() * width;
        const y = random() * height;
        const fade = 1 - Math.max(0, (y / height - 0.55) / 0.45) * 0.85;
        const size = 0.35 + Math.pow(random(), 5) * 1.6;
        const alpha = between(random, 0.3, 1) * fade;
        const tint = STAR_TINTS[Math.floor(random() * STAR_TINTS.length)];

        if (size > 1.2) {
            ctx.globalCompositeOperation = 'lighter';
            softDot(ctx, x, y, size * 5, tint, 0.22 * alpha);
            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.fillStyle = rgba(tint, alpha);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    // A few bright sparkles, kept out of the header strip and the lowest sky.
    const sparkleCount = Math.max(5, Math.round((width * height) / 90000));

    for (let index = 0; index < sparkleCount; index++) {
        sparkle(
            ctx,
            random() * width,
            between(random, 80, height * 0.62),
            between(random, 3.5, 6.5),
            between(random, 0.6, 0.95),
        );
    }

    moon(
        ctx,
        width / 2 + Math.min(width * 0.3, 430),
        phone ? 104 : 118,
        phone ? 24 : 36,
    );

    // Low clouds: dark bodies that rise in the middle, with a faint moonlit top.
    for (let bank = 0; bank < (phone ? 2 : 4); bank++) {
        const cx = between(random, 0.05, 0.95) * width;
        const cy = between(random, 0.6, 0.88) * height;
        const reach = between(random, 140, 280);

        for (let puff = 0; puff < 34; puff++) {
            const spread = bell(random);
            const px = cx + spread * reach;
            const py = cy - (1 - Math.abs(spread)) * between(random, 0, 34);
            const radius =
                between(random, 22, 58) * (1.2 - Math.abs(spread) * 0.5);

            ctx.save();
            ctx.translate(px, py);
            ctx.scale(1.9, 1);
            ctx.globalCompositeOperation = 'source-over';
            softDot(
                ctx,
                0,
                0,
                radius,
                [28, 22, 70],
                between(random, 0.12, 0.22),
            );
            ctx.globalCompositeOperation = 'lighter';
            softDot(ctx, 0, -radius * 0.45, radius * 0.55, LAVENDER, 0.022);
            ctx.restore();
        }
    }

    ctx.globalCompositeOperation = 'source-over';
    grain(ctx, width, height);
}

type Layer = {
    seed: number;
    /** Colour at the foot of a building and at its roof. */
    fill: string;
    roof: string;
    heights: [number, number];
    widths: [number, number];
    gap: number;
    window: { width: number; height: number; step: [number, number] };
    lit: number;
    glow: number;
    windowAlpha: number;
    /** Strength of the moonlit edge on the side that faces the moon. */
    rim: number;
    details: boolean;
};

const LAYERS: Layer[] = [
    {
        seed: 11,
        fill: '#2a1f5e',
        roof: '#35296f',
        heights: [90, 190],
        widths: [26, 64],
        gap: 0.05,
        window: { width: 2, height: 3, step: [7, 9] },
        lit: 0.1,
        glow: 0,
        windowAlpha: 0.35,
        rim: 0.12,
        details: false,
    },
    {
        seed: 23,
        fill: '#160f38',
        roof: '#251c55',
        heights: [60, 150],
        widths: [34, 92],
        gap: 0.08,
        window: { width: 3, height: 4, step: [9, 12] },
        lit: 0.14,
        glow: 0.08,
        windowAlpha: 0.6,
        rim: 0.22,
        details: true,
    },
    {
        seed: 37,
        fill: '#06040f',
        roof: '#16102e',
        heights: [32, 110],
        widths: [44, 120],
        gap: 0.12,
        window: { width: 4, height: 5, step: [12, 15] },
        lit: 0.13,
        glow: 0.16,
        windowAlpha: 0.95,
        rim: 0.3,
        details: true,
    },
];

const WINDOW_TINTS = [
    LAMP,
    LAMP,
    LAMP,
    LAMP,
    LAMP,
    LAMP,
    [255, 236, 214],
    [207, 224, 255],
] as const;

/** Where the moon sits, so buildings can catch its light on the right side. */
function moonX(width: number): number {
    return width / 2 + Math.min(width * 0.3, 430);
}

/** A moonlit line along the top and the side of a shape that faces the moon. */
function rimLight(
    ctx: CanvasRenderingContext2D,
    x: number,
    top: number,
    width: number,
    height: number,
    facesRight: boolean,
    strength: number,
) {
    const edge = ctx.createLinearGradient(0, top, 0, top + height);
    edge.addColorStop(0, `rgba(205, 190, 255, ${strength.toFixed(3)})`);
    edge.addColorStop(0.7, 'rgba(205, 190, 255, 0)');
    ctx.fillStyle = edge;
    ctx.fillRect(facesRight ? x + width - 1.2 : x, top, 1.2, height);
    ctx.fillStyle = `rgba(205, 190, 255, ${(strength * 0.7).toFixed(3)})`;
    ctx.fillRect(x, top, width, 1);
}

/** A slim radio tower far away, with a red light on top. */
function tower(
    ctx: CanvasRenderingContext2D,
    cx: number,
    base: number,
    tall: number,
    fill: string,
) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(cx - 16, base);
    ctx.lineTo(cx - 2, base - tall);
    ctx.lineTo(cx + 2, base - tall);
    ctx.lineTo(cx + 16, base);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(cx - 9, base - tall * 0.45, 18, 4);
    ctx.fillRect(cx - 6, base - tall * 0.7, 12, 3);
    ctx.fillRect(cx - 0.75, base - tall - 22, 1.5, 22);
    ctx.globalCompositeOperation = 'lighter';
    softDot(ctx, cx, base - tall - 22, 9, [255, 90, 100], 0.5);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#ff7a86';
    ctx.fillRect(cx - 1, base - tall - 23, 2, 2);
}

/** A small pagoda for the middle layer, standing on `base`. */
function pagoda(
    ctx: CanvasRenderingContext2D,
    cx: number,
    base: number,
    fill: string,
) {
    ctx.fillStyle = fill;
    ctx.strokeStyle = 'rgba(205, 190, 255, 0.28)';
    ctx.lineWidth = 1;
    let top = base;

    for (let tier = 0; tier < 5; tier++) {
        const roof = base - 30 - tier * 24;
        const width = 82 - tier * 12;
        ctx.fillRect(cx - width * 0.3, roof, width * 0.6, base - roof);
        ctx.beginPath();
        ctx.moveTo(cx - width / 2 - 9, roof - 5);
        ctx.quadraticCurveTo(
            cx - width * 0.4,
            roof + 2,
            cx - width * 0.3,
            roof + 2,
        );
        ctx.lineTo(cx + width * 0.3, roof + 2);
        ctx.quadraticCurveTo(
            cx + width * 0.4,
            roof + 2,
            cx + width / 2 + 9,
            roof - 5,
        );
        ctx.lineTo(cx + width * 0.28, roof - 11);
        ctx.lineTo(cx - width * 0.28, roof - 11);
        ctx.closePath();
        ctx.fill();
        // Moonlight on the upper edge of each roof.
        ctx.beginPath();
        ctx.moveTo(cx - width * 0.28, roof - 11);
        ctx.lineTo(cx + width * 0.28, roof - 11);
        ctx.lineTo(cx + width / 2 + 9, roof - 5);
        ctx.stroke();
        ctx.fillStyle = fill;
        top = roof - 11;
    }

    ctx.fillRect(cx - 1.5, top - 34, 3, 34);

    for (let ring = 0; ring < 4; ring++) {
        ctx.fillRect(cx - 4, top - 8 - ring * 6, 8, 2);
    }

    ctx.globalCompositeOperation = 'lighter';

    for (let tier = 0; tier < 4; tier++) {
        softDot(ctx, cx, base - 18 - tier * 24, 7, LAMP, 0.35);
    }

    ctx.globalCompositeOperation = 'source-over';
}

/** Rooftop clutter: water tanks, antennas with a red light, stepped tops. */
function roofDetail(
    ctx: CanvasRenderingContext2D,
    random: Random,
    x: number,
    top: number,
    width: number,
    fill: string,
) {
    const pick = random();
    ctx.fillStyle = fill;

    if (pick < 0.22) {
        const tx = x + between(random, 0.2, 0.6) * width;
        ctx.fillRect(tx, top - 14, 14, 10);
        ctx.fillRect(tx + 1, top - 4, 2, 4);
        ctx.fillRect(tx + 11, top - 4, 2, 4);
        ctx.beginPath();
        ctx.moveTo(tx - 1, top - 14);
        ctx.lineTo(tx + 7, top - 19);
        ctx.lineTo(tx + 15, top - 14);
        ctx.fill();
    } else if (pick < 0.32) {
        const ax = x + between(random, 0.2, 0.8) * width;
        const tall = between(random, 18, 38);
        ctx.fillRect(ax, top - tall, 1.5, tall);
        ctx.fillRect(ax - 4, top - tall * 0.6, 9.5, 1.2);
        ctx.globalCompositeOperation = 'lighter';
        softDot(ctx, ax + 0.75, top - tall, 6, [255, 90, 100], 0.55);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#ff7a86';
        ctx.fillRect(ax - 0.25, top - tall - 1, 2, 2);
    } else if (pick < 0.7) {
        const inset = width * between(random, 0.15, 0.3);
        ctx.fillRect(x + inset, top - 8, width - inset * 2, 8);
    }
}

/** One building with its windows and rooftop clutter. Its own seed keeps every copy identical. */
function building(
    ctx: CanvasRenderingContext2D,
    layer: Layer,
    seed: number,
    x: number,
    buildingWidth: number,
    buildingHeight: number,
    height: number,
    facesRight: boolean,
) {
    const random = seeded(seed);
    const top = height - buildingHeight;
    const shade = ctx.createLinearGradient(0, top, 0, height);
    shade.addColorStop(0, layer.roof);
    shade.addColorStop(0.6, layer.fill);
    ctx.fillStyle = shade;
    ctx.fillRect(x, top, buildingWidth, buildingHeight);
    rimLight(ctx, x, top, buildingWidth, buildingHeight, facesRight, layer.rim);

    if (layer.details) {
        roofDetail(ctx, random, x, top, buildingWidth, layer.roof);
    }

    const [stepX, stepY] = layer.window.step;
    const columns = Math.floor((buildingWidth - 8) / stepX);
    const rows = Math.floor((buildingHeight - 12) / stepY);
    const left = x + (buildingWidth - columns * stepX) / 2 + 1;
    // Some buildings are mostly dark, some mostly awake. Now and then a
    // whole floor is lit, like an office working late.
    const awake = layer.lit * between(random, 0.2, 2.2);

    for (let row = 0; row < rows; row++) {
        const floorLit = random() < awake * 0.18;
        const floorTint =
            WINDOW_TINTS[Math.floor(random() * WINDOW_TINTS.length)];

        for (let column = 0; column < columns; column++) {
            if (random() > (floorLit ? 0.85 : awake)) {
                continue;
            }

            const wx = left + column * stepX;
            const wy = top + 10 + row * stepY;
            const alpha = layer.windowAlpha * between(random, 0.55, 1);
            const tint = floorLit
                ? floorTint
                : WINDOW_TINTS[Math.floor(random() * WINDOW_TINTS.length)];

            if (layer.glow > 0) {
                ctx.globalCompositeOperation = 'lighter';
                softDot(
                    ctx,
                    wx + layer.window.width / 2,
                    wy + layer.window.height / 2,
                    layer.window.width * 3,
                    tint,
                    layer.glow,
                );
                ctx.globalCompositeOperation = 'source-over';
            }

            ctx.fillStyle = rgba(tint, alpha);
            ctx.fillRect(wx, wy, layer.window.width, layer.window.height);
        }
    }
}

/**
 * The city at the bottom of the page: three rows of buildings, the far ones
 * hazy and tall, the near ones dark with lit windows and rooftop clutter.
 * Edges that face the moon catch its light. The canvas stays clear above the
 * rooftops, so the sky shows through. The picture tiles seamlessly: anything
 * that crosses the right edge is drawn again from the left edge.
 */
export function paintCity(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
) {
    const moon = moonX(width);

    LAYERS.forEach((layer, depth) => {
        const random = seeded(layer.seed);
        let x = 0;
        let index = 0;

        while (x < width) {
            const buildingWidth = between(random, ...layer.widths);

            if (random() < layer.gap) {
                x += buildingWidth * 0.5;
                continue;
            }

            const buildingHeight = between(random, ...layer.heights);
            const seed = layer.seed * 1000 + index++;
            const facesRight = x + buildingWidth / 2 < moon;
            building(
                ctx,
                layer,
                seed,
                x,
                buildingWidth,
                buildingHeight,
                height,
                facesRight,
            );

            if (x + buildingWidth > width) {
                building(
                    ctx,
                    layer,
                    seed,
                    x - width,
                    buildingWidth,
                    buildingHeight,
                    height,
                    facesRight,
                );
            }

            x += buildingWidth + (depth === 2 ? between(random, 0, 6) : 0);
        }

        if (depth === 0) {
            tower(
                ctx,
                width * 0.68,
                height,
                Math.min(height - 40, 200),
                layer.fill,
            );
        }

        // Haze in front of this row, so rows further back look further away.
        if (depth < 2) {
            const haze = ctx.createLinearGradient(0, height - 190, 0, height);
            haze.addColorStop(0, 'rgba(75, 52, 120, 0)');
            haze.addColorStop(
                1,
                `rgba(75, 52, 120, ${depth === 0 ? 0.45 : 0.25})`,
            );
            ctx.fillStyle = haze;
            ctx.fillRect(0, height - 190, width, 190);
        }

        if (depth === 1) {
            pagoda(ctx, Math.max(150, width * 0.28), height, '#100a28');
        }
    });

    // Street light spilling up between the nearest buildings.
    const random = seeded(53);
    ctx.globalCompositeOperation = 'lighter';

    for (
        let x = between(random, 0, 60);
        x < width;
        x += between(random, 60, 140)
    ) {
        const radius = between(random, 18, 34);
        const alpha = between(random, 0.05, 0.12);

        for (const copy of [x - width, x, x + width]) {
            ctx.save();
            ctx.translate(copy, height + 4);
            ctx.scale(2.2, 1);
            softDot(ctx, 0, 0, radius, LAMP, alpha);
            ctx.restore();
        }
    }

    ctx.globalCompositeOperation = 'source-over';
}
