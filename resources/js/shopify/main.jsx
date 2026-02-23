import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import enTranslations from '@shopify/polaris/locales/en.json';
import App from './App';

// App Bridge v4 auto-initializes from the URL `host` param — no Provider wrapper needed.

const container = document.getElementById('shopify-app-root');
const root = createRoot(container);

root.render(
    <AppProvider i18n={enTranslations}>
        <App />
    </AppProvider>
);
