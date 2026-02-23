import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Standalone widget build — outputs a self-contained IIFE to the
 * Theme App Extension assets directory so Shopify can serve it.
 *
 * Run: npm run build:widget
 */
export default defineConfig({
    plugins: [react()],
    publicDir: false, // Don't copy Laravel's public/ folder to extension assets
    build: {
        outDir: 'extensions/form-block/assets',
        emptyOutDir: false,
        lib: {
            entry: 'resources/js/widget/main.jsx',
            name: 'PromptFormWidget',
            fileName: () => 'form-widget.js',
            formats: ['iife'],
        },
        rollupOptions: {
            // Bundle React into the widget — storefront has no React
            external: [],
        },
        minify: true,
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
    },
});
