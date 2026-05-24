import React from 'react';
import { createRoot } from 'react-dom/client';
import FormWidget from '../Shopify/FormWidget';

/**
 * Derive the API base URL from the embed script's own <script src="…"> tag.
 * Falls back to the current page's origin so local dev works too.
 */
function getApiUrl() {
    // document.currentScript works synchronously during script parse
    const current = document.currentScript;
    if (current?.src) {
        const u = new URL(current.src);
        return u.origin + '/api/public';
    }
    // Fallback: scan all scripts for one whose src contains "embed.js"
    for (const s of document.querySelectorAll('script[src]')) {
        if (/\/embed(\.min)?\.js/.test(s.src)) {
            const u = new URL(s.src);
            return u.origin + '/api/public';
        }
    }
    return window.location.origin + '/api/public';
}

const API_URL = getApiUrl();

function mountForm(el) {
    if (el.dataset.pfMounted === 'true') return;
    el.dataset.pfMounted = 'true';

    const ulid = el.dataset.pfForm;

    if (!ulid) {
        console.warn('[PromptForm] Missing data-pf-form attribute on element:', el);
        return;
    }

    createRoot(el).render(<FormWidget ulid={ulid} apiUrl={API_URL} />);
}

function init() {
    document.querySelectorAll('[data-pf-form]').forEach(mountForm);
}

// Watch for forms added to the DOM dynamically (SPAs, lazy sections, etc.)
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            if (node.dataset?.pfForm) mountForm(node);
            node.querySelectorAll('[data-pf-form]').forEach(mountForm);
        }
    }
});

function start() {
    init();
    observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}

// Public API for manual control
window.PromptForm = { init, mount: mountForm };
