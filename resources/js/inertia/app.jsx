import React from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';

createInertiaApp({
    resolve: (name) => {
        const pages = import.meta.glob('./pages/**/*.jsx', { eager: true });
        return pages[`./pages/${name}.jsx`];
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <ConfigProvider theme={{ token: { colorPrimary: '#6366f1' } }}>
                <App {...props} />
            </ConfigProvider>
        );
    },
});
