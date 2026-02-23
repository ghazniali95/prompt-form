import React from 'react';
import { createRoot } from 'react-dom/client';
import FormWidget from './FormWidget';

function mountWidget(el) {
    // Prevent double-mounting if script is included multiple times
    if (el.dataset.pfMounted === 'true') return;
    el.dataset.pfMounted = 'true';

    const ulid = el.dataset.formUlid;
    const apiUrl = (el.dataset.apiUrl || '').replace(/\/$/, '');

    if (!ulid || !apiUrl) {
        console.warn('[PromptForm] Missing data-form-ulid or data-api-url on', el);
        return;
    }

    createRoot(el).render(<FormWidget ulid={ulid} apiUrl={apiUrl} />);
}

function init() {
    document.querySelectorAll('[data-prompt-form]').forEach(mountWidget);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
