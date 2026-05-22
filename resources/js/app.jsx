import React from 'react';
import axios from 'axios';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';

axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const theme = {
    token: {
        colorPrimary:        '#f97316',
        colorPrimaryHover:   '#ea580c',
        colorLink:           '#f97316',
        colorLinkHover:      '#ea580c',
        colorBgLayout:       '#ffffff',
        borderRadius:        8,
        borderRadiusLG:      12,
        borderRadiusSM:      6,
        fontFamily:          "'Manrope', sans-serif",
    },
    components: {
        Menu: {
            darkItemBg:              '#111111',
            darkItemSelectedBg:      '#1f1f1f',
            darkItemSelectedColor:   '#ffffff',
            darkItemHoverBg:         '#1a1a1a',
            darkItemHoverColor:      '#fb923c',
            darkItemColor:           '#888888',
            darkItemDisabledColor:   '#444444',
            itemSelectedBg:          '#fff3e8',
            itemSelectedColor:       '#f97316',
            itemHoverBg:             '#fff7f0',
            itemHoverColor:          '#f97316',
            itemColor:               '#555',
            iconSize:                15,
        },
        Layout: {
            siderBg: '#ffffff',
            bodyBg:  '#ffffff',
        },
        Button: {
            primaryColor: '#ffffff',
        },
        Progress: {
            defaultColor: '#f97316',
        },
        Card: {
            colorBgContainer: '#ffffff',
        },
        Tag: {
            defaultBg:    '#fff3e8',
            defaultColor: '#f97316',
        },
    },
};

createInertiaApp({
    resolve: (name) => {
        const pages = import.meta.glob('./pages/**/*.jsx', { eager: true });
        return pages[`./pages/${name}.jsx`];
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <ConfigProvider theme={theme}>
                <App {...props} />
            </ConfigProvider>
        );
    },
});
