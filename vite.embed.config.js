import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Universal embed script build.
 * Outputs a self-contained IIFE to public/embed.js so it is served
 * directly by the web server at https://your-app.com/embed.js.
 *
 * Usage on any website:
 *   <!-- Once in <head> -->
 *   <script src="https://app.aipromptform.com/embed.js"></script>
 *
 *   <!-- Anywhere in <body> -->
 *   <div data-pf-form="YOUR_FORM_ULID"></div>
 *
 * Run: npm run build:embed
 */
export default defineConfig({
    plugins: [react()],
    publicDir: false,
    build: {
        outDir: 'public',
        emptyOutDir: false,
        lib: {
            entry: 'resources/js/widgets/Web/main.jsx',
            name: 'PromptForm',
            fileName: () => 'embed.js',
            formats: ['iife'],
        },
        rollupOptions: {
            external: [],
        },
        minify: true,
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
    },
});
