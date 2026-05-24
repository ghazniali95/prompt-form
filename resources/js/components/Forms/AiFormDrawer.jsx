import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Drawer, Button, Input, Typography, Space, Tooltip, Avatar, message,
} from 'antd';
import {
    ArrowLeftOutlined, SendOutlined, RobotOutlined, UserOutlined,
    SaveOutlined, CheckOutlined, DesktopOutlined, MobileOutlined,
    CopyOutlined, LoadingOutlined, EditOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { router } from '@inertiajs/react';
import axios from 'axios';

// Wraps React JSX componentCode (Tailwind) in a self-contained iframe document.
// JSON.stringify + unicode escaping prevents </script> from breaking the script block.
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

const { Text } = Typography;
const { TextArea } = Input;

const WELCOME_MESSAGE = {
    id: 'welcome',
    role: 'assistant',
    content: "Hi! I'm your AI form builder. Describe the form you'd like to create — the more detail you give me, the better the result.",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MessageBubble({ msg }) {
    const isAi = msg.role === 'assistant';

    if (msg.isLimitReached) {
        return (
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
                <Avatar size={32} icon={<ThunderboltOutlined />} style={{ background: '#f97316', flexShrink: 0, fontSize: 14 }} />
                <div style={{
                    maxWidth: '80%', background: '#fff7ed',
                    borderRadius: '4px 14px 14px 14px', padding: '12px 16px',
                    border: '1px solid #fed7aa',
                }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#c2410c', marginBottom: 6 }}>
                        AI Usage limit reached
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: '#374151', marginBottom: 10 }}>
                        You've used all your AI Usage for this month. Upgrade your plan to keep building forms with AI.
                    </div>
                    <button
                        onClick={() => router.visit('/pricing')}
                        style={{
                            background: '#f97316', color: '#fff', border: 'none',
                            borderRadius: 8, padding: '6px 16px', fontSize: 13,
                            fontWeight: 700, cursor: 'pointer',
                        }}
                    >
                        Upgrade your plan
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            gap: 10,
            flexDirection: isAi ? 'row' : 'row-reverse',
            marginBottom: 16,
            alignItems: 'flex-start',
        }}>
            <Avatar
                size={32}
                icon={isAi ? <RobotOutlined /> : <UserOutlined />}
                style={{ background: isAi ? '#111' : '#f97316', flexShrink: 0, fontSize: 14 }}
            />
            <div style={{
                maxWidth: '80%',
                background: isAi ? '#f4f4f5' : '#fff3e8',
                borderRadius: isAi ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                padding: '10px 14px',
                fontSize: 13.5,
                lineHeight: 1.6,
                color: '#111',
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
            <Avatar size={32} icon={<RobotOutlined />} style={{ background: '#111', flexShrink: 0, fontSize: 14 }} />
            <div style={{ background: '#f4f4f5', borderRadius: '4px 14px 14px 14px', padding: '12px 16px', display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%', background: '#aaa',
                        animation: 'bounce 1.2s infinite',
                        animationDelay: `${i * 0.2}s`,
                    }} />
                ))}
                <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
            </div>
        </div>
    );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

export default function AiFormDrawer({ open, form, onClose, onFormUpdated }) {
    const [messages, setMessages]     = useState([WELCOME_MESSAGE]);
    const [input, setInput]           = useState('');
    const [thinking, setThinking]     = useState(false);
    const [loading, setLoading]       = useState(false);
    const [htmlContent, setHtml]      = useState('');
    const [viewport, setViewport]     = useState('desktop');
    const [formTitle, setFormTitle]   = useState('');
    const [editingTitle, setEditing]  = useState(false);
    const [publishing, setPublishing] = useState(false);
    const messagesEndRef              = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, thinking]);

    // Load conversation when drawer opens for a given form
    useEffect(() => {
        if (!open || !form?.id) return;

        setFormTitle(form.title ?? '');
        setHtml('');
        setMessages([WELCOME_MESSAGE]);
        setLoading(true);

        axios.get(`/api/v1/forms/${form.id}/conversation`)
            .then(({ data }) => {
                if (data.html_content) setHtml(data.html_content);
                if (data.data?.length) setMessages(data.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [open, form?.id]);

    const isLimitReached = messages.some(m => m.isLimitReached);

    const handleSend = useCallback(async () => {
        const text = input.trim();
        if (!text || thinking || !form?.id || isLimitReached) return;

        setInput('');
        const userMsg = { id: `u-${Date.now()}`, role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setThinking(true);

        try {
            const { data } = await axios.post(`/api/v1/forms/${form.id}/chat`, { message: text });
            const { reply, html_content } = data.data;
            setHtml(html_content);
            setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: reply }]);
        } catch (err) {
            const data = err.response?.data ?? {};
            if (data.error === 'ai_limit_reached') {
                setMessages(prev => [
                    ...prev.filter(m => m.id !== userMsg.id),
                    { id: `limit-${Date.now()}`, role: 'assistant', isLimitReached: true },
                ]);
            } else {
                message.error(data.message ?? 'AI generation failed. Please try again.');
                setMessages(prev => prev.filter(m => m.id !== userMsg.id));
            }
        } finally {
            setThinking(false);
        }
    }, [input, thinking, form?.id, isLimitReached]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
    };

    const handleTitleSave = async () => {
        setEditing(false);
        const title = formTitle.trim();
        if (!title || !form?.id || title === form.title) return;
        try {
            await axios.patch(`/api/v1/forms/${form.id}`, { title });
            onFormUpdated?.({ id: form.id, title });
        } catch {
            message.error('Failed to rename form.');
        }
    };

    const handlePublish = async () => {
        if (!form?.id) return;
        setPublishing(true);
        try {
            await axios.post(`/api/v1/forms/${form.id}/publish`);
            message.success('Form published!');
            onFormUpdated?.({ id: form.id, status: 'published' });
        } catch (err) {
            message.error(err.response?.data?.error ?? 'Failed to publish.');
        } finally {
            setPublishing(false);
        }
    };

    const copyEmbedCode = () => {
        const code = `<script src="https://promptform.mesh99.com/widget.js" data-form-id="${form?.ulid ?? ''}"><\/script>`;
        navigator.clipboard.writeText(code);
        message.success('Embed code copied!');
    };

    return (
        <Drawer
            open={open}
            onClose={onClose}
            width="100%"
            closable={false}
            destroyOnHidden
            styles={{
                body:   { padding: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
                header: { display: 'none' },
            }}
        >
            {/* ── Header ── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 24px', height: 56, borderBottom: '1px solid #f0f0f0',
                background: '#fff', flexShrink: 0,
            }}>
                <Button icon={<ArrowLeftOutlined />} type="text" onClick={onClose} style={{ fontWeight: 600, color: '#555' }}>
                    Back to Forms
                </Button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {editingTitle ? (
                        <Input
                            autoFocus
                            size="small"
                            value={formTitle}
                            onChange={e => setFormTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onPressEnter={handleTitleSave}
                            style={{ width: 220, fontWeight: 700, fontSize: 15 }}
                        />
                    ) : (
                        <Text strong style={{ fontSize: 15 }}>{formTitle || 'Untitled Form'}</Text>
                    )}
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => setEditing(true)} style={{ color: '#bbb' }} />
                </div>

                <Space>
                    <Button icon={<SaveOutlined />} onClick={onClose}>Save Draft</Button>
                    <Button
                        type="primary"
                        icon={publishing ? <LoadingOutlined /> : <CheckOutlined />}
                        onClick={handlePublish}
                        disabled={!htmlContent || publishing}
                    >
                        Publish
                    </Button>
                </Space>
            </div>

            {/* ── Body ── */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* Chat panel — 40% */}
                <div style={{
                    width: '40%', minWidth: 340,
                    display: 'flex', flexDirection: 'column',
                    borderRight: '1px solid #f0f0f0', background: '#fff',
                }}>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 8px' }}>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
                                <LoadingOutlined style={{ fontSize: 24, color: '#bbb' }} />
                            </div>
                        ) : (
                            messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
                        )}
                        {thinking && <ThinkingBubble />}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{ padding: '12px 16px 16px', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <TextArea
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={isLimitReached ? 'AI Usage limit reached — upgrade to continue' : 'Describe changes or ask for a new form…'}
                                autoSize={{ minRows: 2, maxRows: 5 }}
                                disabled={thinking || loading || isLimitReached}
                                style={{ paddingRight: 52, borderRadius: 10, fontSize: 13.5, resize: 'none' }}
                            />
                            <Button
                                type="primary"
                                icon={thinking ? <LoadingOutlined /> : <SendOutlined />}
                                onClick={handleSend}
                                disabled={!input.trim() || thinking || loading || isLimitReached}
                                style={{ position: 'absolute', right: 8, bottom: 8, width: 34, height: 34, borderRadius: 8, padding: 0 }}
                            />
                        </div>
                        <Text type="secondary" style={{ fontSize: 11, marginTop: 6, display: 'block' }}>
                            ⌘ Enter to send
                        </Text>
                    </div>
                </div>

                {/* Preview panel — 60% */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f5f5f5', overflow: 'hidden' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 20px', borderBottom: '1px solid #ebebeb', background: '#fafafa', flexShrink: 0,
                    }}>
                        <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Live Preview
                        </Text>
                        <Space>
                            <Button.Group size="small">
                                <Tooltip title="Desktop">
                                    <Button icon={<DesktopOutlined />} type={viewport === 'desktop' ? 'primary' : 'default'} onClick={() => setViewport('desktop')} />
                                </Tooltip>
                                <Tooltip title="Mobile">
                                    <Button icon={<MobileOutlined />}  type={viewport === 'mobile'  ? 'primary' : 'default'} onClick={() => setViewport('mobile')} />
                                </Tooltip>
                            </Button.Group>
                            <Tooltip title="Copy embed code">
                                <Button size="small" icon={<CopyOutlined />} onClick={copyEmbedCode} disabled={!form?.ulid}>
                                    Embed Code
                                </Button>
                            </Tooltip>
                        </Space>
                    </div>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 32, overflow: 'auto' }}>
                        {htmlContent ? (
                            <div style={{
                                width: viewport === 'mobile' ? 375 : '100%',
                                maxWidth: viewport === 'mobile' ? 375 : 860,
                                height: viewport === 'mobile' ? 700 : '100%',
                                minHeight: 480,
                                background: '#fff', borderRadius: 12, overflow: 'hidden',
                                boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
                                transition: 'all 0.3s',
                                flexShrink: 0,
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
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                height: '100%', color: '#bbb', gap: 12,
                            }}>
                                <RobotOutlined style={{ fontSize: 48 }} />
                                <Text type="secondary" style={{ fontSize: 14 }}>
                                    Describe your form in the chat to generate a preview
                                </Text>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Drawer>
    );
}
