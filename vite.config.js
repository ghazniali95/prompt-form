import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/shopify/embedded/main.jsx',
                'resources/js/app.jsx',
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
            '@embed':      '/resources/js/shopify/embedded',
            '@components': '/resources/js/components',
            '@layouts':    '/resources/js/layouts',
            '@pages':      '/resources/js/pages',
        },
    },
    css: {
        preprocessorOptions: {},
    },
});
