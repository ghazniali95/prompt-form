import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Button, TextField, Spinner, Text, InlineStack, BlockStack, Tooltip, Badge,
} from '@shopify/polaris';
import {
    ArrowLeftIcon, SendIcon, CheckIcon, DesktopIcon, MobileIcon,
    ClipboardIcon, EditIcon,
} from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from './hooks/useAuthenticatedFetch';

// ─── Preview doc builder ──────────────────────────────────────────────────────
// Same approach as AiFormDrawer on the web side.

function buildPreviewDoc(componentCode) {
    const safeCode = JSON.stringify(componentCode)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e');

    return [
        '<!DOCTYPE html>',
        '<html>',
        '<head>',
        '<meta charset="UTF-8">',
        '<meta name="viewport" content="width=device-width,initial-scale=1.0">',
        '<script src="https://cdn.tailwindcss.com"><' + '/script>',
        '<style>html,body{margin:0;padding:0;background:transparent;}#root{min-height:100vh;}<' + '/style>',
        '</head>',
        '<body>',
        '<div id="root"></div>',
        '<script src="https://unpkg.com/react@18/umd/react.production.min.js"><' + '/script>',
        '<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><' + '/script>',
        '<script src="https://unpkg.com/@babel/standalone/babel.min.js"><' + '/script>',
        '<script>',
        'const{useState,useEffect,useRef,useCallback,useMemo,useReducer}=React;',
        'try{',
        '  var _c=' + safeCode + ';',
        '  eval(Babel.transform(_c,{presets:["react"]}).code);',
        '}catch(e){',
        '  document.getElementById("root").innerHTML=',
        '    "<div style=\'padding:24px;color:#dc2626;font-family:monospace;font-size:13px;white-space:pre-wrap\'>"',
        '    +"<strong>Preview error:</strong>\\n"+e.message+"<' + '/div>";',
        '}',
        '<' + '/script>',
        '</body>',
        '</html>',
    ].join('\n');
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WELCOME_MESSAGE = {
    id: 'welcome',
    role: 'assistant',
    content: "Hi! I'm your AI form builder. Describe the form you'd like to create — the more detail you give me, the better the result.",
};

// ─── Chat bubbles ─────────────────────────────────────────────────────────────

function MessageBubble({ msg }) {
    const isAi = msg.role === 'assistant';
    return (
        <div style={{
            display: 'flex',
            gap: 10,
            flexDirection: isAi ? 'row' : 'row-reverse',
            marginBottom: 16,
            alignItems: 'flex-start',
        }}>
            <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: isAi ? 'var(--p-color-bg-surface-inverse, #1a1a1a)' : 'var(--p-color-bg-fill-brand, #303030)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff',
            }}>
                {isAi ? 'AI' : 'U'}
            </div>
            <div style={{
                maxWidth: '80%',
                background: isAi ? 'var(--p-color-bg-surface-secondary, #f6f6f7)' : '#fff3e8',
                borderRadius: isAi ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                padding: '10px 14px',
                fontSize: 13.5,
                lineHeight: 1.6,
                color: 'var(--p-color-text, #202223)',
                border: isAi ? 'none' : '1px solid #fde8d0',
            }}>
                {msg.content}
            </div>
        </div>
    );
}

function ThinkingBubble() {
    return (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
            <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: 'var(--p-color-bg-surface-inverse, #1a1a1a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff',
            }}>
                AI
            </div>
            <div style={{
                background: 'var(--p-color-bg-surface-secondary, #f6f6f7)',
                borderRadius: '4px 14px 14px 14px',
                padding: '12px 16px', display: 'flex', gap: 5, alignItems: 'center',
            }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'var(--p-color-border, #8c9196)',
                        animation: 'pfBounce 1.2s infinite',
                        animationDelay: `${i * 0.2}s`,
                    }} />
                ))}
                <style>{`@keyframes pfBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
            </div>
        </div>
    );
}

// ─── Main FormBuilder ─────────────────────────────────────────────────────────

export default function FormBuilder({ formId, onBack, onNavigatePricing }) {
    const api = useAuthenticatedFetch();

    const [currentFormId, setCurrentFormId] = useState(formId ?? null);
    const [formUlid,      setFormUlid]      = useState(null);
    const [formTitle,     setFormTitle]     = useState('Untitled Form');
    const [editingTitle,  setEditingTitle]  = useState(false);
    const [isPublished,   setIsPublished]   = useState(false);
    const [messages,      setMessages]      = useState([WELCOME_MESSAGE]);
    const [input,         setInput]         = useState('');
    const [thinking,      setThinking]      = useState(false);
    const [loading,       setLoading]       = useState(!!formId);
    const [htmlContent,   setHtmlContent]   = useState('');
    const [viewport,      setViewport]      = useState('desktop');
    const [publishing,    setPublishing]    = useState(false);
    const [idCopied,      setIdCopied]      = useState(false);
    const [upgradeError,  setUpgradeError]  = useState(null);

    const messagesEndRef  = useRef(null);
    const currentFormIdRef = useRef(formId ?? null);

    useEffect(() => {
        currentFormIdRef.current = currentFormId;
    }, [currentFormId]);

    // Scroll chat to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, thinking]);

    // Load existing form + conversation history
    useEffect(() => {
        if (!formId) return;
        setLoading(true);

        Promise.all([
            api.get(`/api/v1/forms/${formId}`),
            api.get(`/api/v1/forms/${formId}/conversation`),
        ])
            .then(([formRes, convRes]) => {
                const form = formRes.data.data;
                setFormTitle(form.title ?? 'Untitled Form');
                setFormUlid(form.ulid ?? null);
                setIsPublished(!!form.is_published);
                if (form.html_content) setHtmlContent(form.html_content);

                const conv = convRes.data;
                if (conv.html_content) setHtmlContent(conv.html_content);
                if (conv.data?.length)  setMessages(conv.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [formId]);

    // Create form on first send if it doesn't exist yet
    const ensureForm = useCallback(async () => {
        if (currentFormIdRef.current) return currentFormIdRef.current;

        const { data } = await api.post('/api/v1/forms', { title: 'Untitled Form' });
        const form = data.data;
        setCurrentFormId(form.id);
        setFormUlid(form.ulid ?? null);
        currentFormIdRef.current = form.id;
        return form.id;
    }, [api]);

    const handleSend = useCallback(async () => {
        const text = input.trim();
        if (!text || thinking) return;

        setInput('');
        const userMsg = { id: `u-${Date.now()}`, role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setThinking(true);
        setUpgradeError(null);

        try {
            const fId = await ensureForm();
            const { data } = await api.post(`/api/v1/forms/${fId}/chat`, { message: text });
            const { reply, html_content, meta } = data.data;

            setHtmlContent(html_content);
            if (meta?.title) setFormTitle(meta.title);
            setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: reply }]);
        } catch (err) {
            const body = err.response?.data;
            if (body?.upgrade_required) {
                setUpgradeError(body.message);
                setMessages(prev => prev.filter(m => m.id !== userMsg.id));
            } else {
                const errMsg = body?.error ?? body?.message ?? 'AI generation failed. Please try again.';
                setMessages(prev => [
                    ...prev.filter(m => m.id !== userMsg.id),
                    { id: `err-${Date.now()}`, role: 'assistant', content: errMsg },
                ]);
            }
        } finally {
            setThinking(false);
        }
    }, [input, thinking, ensureForm, api]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
    };

    const handleTitleSave = async () => {
        setEditingTitle(false);
        const title = formTitle.trim() || 'Untitled Form';
        setFormTitle(title);
        if (!currentFormId) return;
        try { await api.patch(`/api/v1/forms/${currentFormId}`, { title }); } catch {}
    };

    const handlePublish = async () => {
        if (!currentFormId) return;
        setPublishing(true);
        try {
            await api.post(`/api/v1/forms/${currentFormId}/publish`);
            setIsPublished(true);
        } catch (err) {
            const body = err.response?.data;
            if (body?.upgrade_required) setUpgradeError(body.message);
        } finally {
            setPublishing(false);
        }
    };

    const copyEmbedCode = () => {
        if (!formUlid) return;
        navigator.clipboard.writeText(formUlid);
        setIdCopied(true);
        setTimeout(() => setIdCopied(false), 2000);
    };

    // ── Header ────────────────────────────────────────────────────────────────

    const header = (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 20px', height: 56, flexShrink: 0,
            borderBottom: '1px solid var(--p-color-border-subdued, #e4e5e7)',
            background: 'var(--p-color-bg-surface, #fff)',
        }}>
            <Button icon={ArrowLeftIcon} variant="plain" onClick={onBack}>
                Back to Forms
            </Button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {editingTitle ? (
                    <input
                        autoFocus
                        value={formTitle}
                        onChange={e => setFormTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={e => e.key === 'Enter' && handleTitleSave()}
                        style={{
                            width: 220, fontWeight: 700, fontSize: 15, padding: '4px 8px',
                            border: '1px solid var(--p-color-border, #8c9196)', borderRadius: 6,
                            fontFamily: 'inherit', background: 'var(--p-color-bg-surface, #fff)',
                            color: 'var(--p-color-text, #202223)',
                        }}
                    />
                ) : (
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--p-color-text, #202223)' }}>
                        {formTitle || 'Untitled Form'}
                    </span>
                )}
                <Button icon={EditIcon} variant="plain" accessibilityLabel="Edit title"
                    onClick={() => setEditingTitle(true)} />
                {isPublished && <Badge tone="success">Published</Badge>}
            </div>

            <InlineStack gap="200">
                <Button icon={ClipboardIcon} variant="plain" disabled={!formUlid} onClick={copyEmbedCode}>
                    {idCopied ? 'Copied!' : 'Copy Form ID'}
                </Button>
                <Button variant="plain" onClick={onBack}>Save Draft</Button>
                <Button
                    variant="primary"
                    icon={publishing ? undefined : CheckIcon}
                    onClick={handlePublish}
                    disabled={!htmlContent || publishing || isPublished}
                    loading={publishing}
                >
                    {isPublished ? 'Published' : 'Publish'}
                </Button>
            </InlineStack>
        </div>
    );

    // ── Upgrade banner ────────────────────────────────────────────────────────

    const upgradeBanner = upgradeError && (
        <div style={{
            padding: '10px 20px', background: '#fff3cd',
            borderBottom: '1px solid #ffc107',
            display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
            <span style={{ fontSize: 13, color: '#664d03' }}>{upgradeError}</span>
            <Button variant="plain" size="slim" onClick={onNavigatePricing}>View billing options</Button>
            <Button variant="plain" size="slim" onClick={() => setUpgradeError(null)}>Dismiss</Button>
        </div>
    );

    // ── Loading state ─────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'var(--p-color-bg, #f6f6f7)', display: 'flex', flexDirection: 'column' }}>
                {header}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Spinner />
                </div>
            </div>
        );
    }

    // ── Main layout ───────────────────────────────────────────────────────────

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'var(--p-color-bg, #f6f6f7)',
            display: 'flex', flexDirection: 'column',
        }}>
            {header}
            {upgradeBanner}

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* ── Chat panel (40%) ──────────────────────────────────── */}
                <div style={{
                    width: '40%', minWidth: 320,
                    display: 'flex', flexDirection: 'column',
                    borderRight: '1px solid var(--p-color-border-subdued, #e4e5e7)',
                    background: 'var(--p-color-bg-surface, #fff)',
                }}>
                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 8px' }}>
                        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
                        {thinking && <ThinkingBubble />}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{
                        padding: '12px 16px 16px',
                        borderTop: '1px solid var(--p-color-border-subdued, #e4e5e7)',
                        flexShrink: 0,
                    }}>
                        <div style={{ position: 'relative' }}>
                            <textarea
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Describe changes or ask for a new form…"
                                disabled={thinking}
                                rows={3}
                                style={{
                                    width: '100%', resize: 'none', boxSizing: 'border-box',
                                    paddingRight: 48, paddingLeft: 12, paddingTop: 10, paddingBottom: 10,
                                    borderRadius: 10, fontSize: 13.5, lineHeight: 1.5,
                                    border: '1px solid var(--p-color-border, #8c9196)',
                                    fontFamily: 'inherit', outline: 'none',
                                    background: 'var(--p-color-bg-surface, #fff)',
                                    color: 'var(--p-color-text, #202223)',
                                    opacity: thinking ? 0.6 : 1,
                                }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || thinking}
                                style={{
                                    position: 'absolute', right: 8, bottom: 8,
                                    width: 34, height: 34, borderRadius: 8,
                                    border: 'none', cursor: input.trim() && !thinking ? 'pointer' : 'not-allowed',
                                    background: input.trim() && !thinking
                                        ? 'var(--p-color-bg-fill-brand, #303030)'
                                        : 'var(--p-color-bg-surface-disabled, #e4e5e7)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'background 0.15s',
                                }}
                                aria-label="Send message"
                            >
                                {thinking ? (
                                    <span style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Spinner size="small" />
                                    </span>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ transform: 'rotate(90deg)' }}>
                                        <path d="M10 3L10 17M10 3L5 8M10 3L15 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--p-color-text-subdued, #6d7175)' }}>
                            ⌘ Enter to send
                        </p>
                    </div>
                </div>

                {/* ── Preview panel (60%) ───────────────────────────────── */}
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    background: 'var(--p-color-bg, #f6f6f7)',
                    overflow: 'hidden',
                }}>
                    {/* Preview toolbar */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 20px', flexShrink: 0,
                        borderBottom: '1px solid var(--p-color-border-subdued, #e4e5e7)',
                        background: 'var(--p-color-bg-surface-secondary, #fafafa)',
                    }}>
                        <span style={{
                            fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
                            textTransform: 'uppercase', color: 'var(--p-color-text-subdued, #6d7175)',
                        }}>
                            Live Preview
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <Tooltip content="Desktop view">
                                <Button
                                    icon={DesktopIcon}
                                    size="slim"
                                    variant={viewport === 'desktop' ? 'primary' : 'plain'}
                                    onClick={() => setViewport('desktop')}
                                    accessibilityLabel="Desktop view"
                                />
                            </Tooltip>
                            <Tooltip content="Mobile view">
                                <Button
                                    icon={MobileIcon}
                                    size="slim"
                                    variant={viewport === 'mobile' ? 'primary' : 'plain'}
                                    onClick={() => setViewport('mobile')}
                                    accessibilityLabel="Mobile view"
                                />
                            </Tooltip>
                        </div>
                    </div>

                    {/* Preview area */}
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'flex-start',
                        justifyContent: 'center', padding: 32, overflow: 'auto',
                    }}>
                        {htmlContent ? (
                            <div style={{
                                width: viewport === 'mobile' ? 375 : '100%',
                                maxWidth: viewport === 'mobile' ? 375 : 860,
                                height: viewport === 'mobile' ? 700 : '100%',
                                minHeight: 480,
                                background: '#fff', borderRadius: 12, overflow: 'hidden',
                                boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
                                transition: 'all 0.3s', flexShrink: 0,
                            }}>
                                <iframe
                                    title="Form Preview"
                                    srcDoc={buildPreviewDoc(htmlContent)}
                                    style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                                />
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', height: '100%', gap: 16,
                                color: 'var(--p-color-text-subdued, #6d7175)',
                            }}>
                                <div style={{
                                    width: 64, height: 64, borderRadius: '50%',
                                    background: 'var(--p-color-bg-surface-secondary, #f6f6f7)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 28,
                                }}>
                                    ✦
                                </div>
                                <BlockStack gap="100">
                                    <Text variant="bodyMd" tone="subdued" alignment="center">
                                        Describe your form in the chat to generate a preview
                                    </Text>
                                    <Text variant="bodySm" tone="subdued" alignment="center">
                                        Try: "Create a contact form with name, email and message"
                                    </Text>
                                </BlockStack>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
