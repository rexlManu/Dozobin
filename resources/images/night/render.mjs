/*
  Renders the Long night art (resources/js/lib/night-paint.ts) into the WebP
  files next to this script. The app only loads these images; it never paints
  at runtime. Run it again after you change the painter:

      node resources/images/night/render.mjs

  It drives Google Chrome through Playwright. Playwright is not a project
  dependency: set PLAYWRIGHT_FROM to a folder that has it installed, for
  example PLAYWRIGHT_FROM=/tmp/pw/ after `pnpm add playwright` in /tmp/pw.
*/
import { Buffer } from 'node:buffer';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire, stripTypeScriptTypes } from 'node:module';
import process from 'node:process';

const here = new URL('./', import.meta.url);
const require = createRequire(process.env.PLAYWRIGHT_FROM ?? import.meta.url);
const { chromium } = require('playwright');

/** Each image: the painter, its size in CSS pixels, and the pixel scale. */
const IMAGES = [
    {
        file: 'sky-wide.webp',
        paint: 'paintSky',
        width: 1920,
        height: 1080,
        scale: 1.5,
        quality: 0.8,
    },
    {
        file: 'sky-tall.webp',
        paint: 'paintSky',
        width: 430,
        height: 932,
        scale: 2,
        quality: 0.8,
    },
    {
        file: 'city.webp',
        paint: 'paintCity',
        width: 1600,
        height: 260,
        scale: 2,
        quality: 0.8,
    },
];

const source = await readFile(
    new URL('../../js/lib/night-paint.ts', here),
    'utf8',
);
const code = stripTypeScriptTypes(source);
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();

for (const image of IMAGES) {
    const base64 = await page.evaluate(
        async ({ code, image }) => {
            const painters = await import(
                URL.createObjectURL(
                    new Blob([code], { type: 'text/javascript' }),
                )
            );
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(image.width * image.scale);
            canvas.height = Math.round(image.height * image.scale);
            const ctx = canvas.getContext('2d');
            ctx.setTransform(image.scale, 0, 0, image.scale, 0, 0);
            painters[image.paint](ctx, image.width, image.height);

            return canvas.toDataURL('image/webp', image.quality).split(',')[1];
        },
        { code, image },
    );
    const bytes = Buffer.from(base64, 'base64');
    await writeFile(new URL(image.file, here), bytes);
    console.log(`${image.file}: ${Math.round(bytes.length / 1024)} KB`);
}

await browser.close();
