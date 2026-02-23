import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/js/shopify/main.jsx',
                'resources/js/inertia/app.jsx',
            ],
            refresh: true,
        }),
        react(),
    ],
    server: {
        cors: true,
        hmr: {
            host: 'localhost',
        },
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
    resolve: {
        alias: {
            '@app-shopify': '/resources/js/shopify',
            '@app-inertia': '/resources/js/inertia',
        },
    },
    css: {
        preprocessorOptions: {},
    },
});
