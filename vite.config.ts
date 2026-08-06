import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig } from 'vite';

const ddevPrimaryUrl = process.env.DDEV_PRIMARY_URL_WITHOUT_PORT;
const ddevHostname = process.env.DDEV_HOSTNAME;
const isDdev = ddevPrimaryUrl !== undefined && ddevHostname !== undefined;

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        inertia(),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    ...(isDdev && {
        server: {
            host: '0.0.0.0',
            port: 5173,
            strictPort: true,
            origin: `${ddevPrimaryUrl}:5173`,
            cors: {
                origin: ddevPrimaryUrl,
            },
            hmr: {
                host: ddevHostname,
                protocol: 'wss',
                clientPort: 5173,
            },
        },
    }),
});
