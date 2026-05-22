import React, { useState, useRef, useEffect } from 'react';
import {
    Drawer, Button, Input, Typography, Tag, Space, Tooltip,
    Spin, Avatar, Divider, Select,
} from 'antd';
import {
    ArrowLeftOutlined, SendOutlined, RobotOutlined, UserOutlined,
    SaveOutlined, CheckOutlined, DesktopOutlined, MobileOutlined,
    CopyOutlined, LoadingOutlined, EditOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;
const { TextArea } = Input;

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_MESSAGES = [
    {
        id: 1,
        role: 'assistant',
        content: "Hi! I'm your AI form builder. Describe the form you'd like to create — the more detail you give me, the better the result.",
    },
    {
        id: 2,
        role: 'user',
        content: 'Create a contact form with name, email, phone (required), and a message textarea. Make it look clean and professional.',
    },
    {
        id: 3,
        role: 'assistant',
        content: "Done! I've generated a clean contact form with all four fields. Phone is marked required with validation. Check the preview on the right — let me know if you'd like any changes.",
    },
    {
        id: 4,
        role: 'user',
        content: 'Add a dropdown "How did you hear about us?" with options: Google, Social Media, Friend, Other.',
    },
    {
        id: 5,
        role: 'assistant',
        content: 'Added! The dropdown is placed just before the submit button. The preview has been updated.',
    },
];

const MOCK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
  .card { background: #fff; border-radius: 16px; padding: 40px; max-width: 520px; width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  h2 { font-size: 22px; font-weight: 700; color: #111; margin-bottom: 6px; }
  .subtitle { font-size: 14px; color: #888; margin-bottom: 28px; }
  .field { margin-bottom: 18px; }
  label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
  .required { color: #ef4444; margin-left: 2px; }
  input, textarea, select {
    width: 100%; padding: 10px 14px; border: 1.5px solid #e5e7eb;
    border-radius: 8px; font-size: 14px; color: #111; background: #fff;
    transition: border-color 0.2s; outline: none; font-family: inherit;
  }
  input:focus, textarea:focus, select:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.12); }
  textarea { resize: vertical; min-height: 110px; }
  select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  button {
    width: 100%; padding: 12px; background: #f97316; color: #fff;
    border: none; border-radius: 8px; font-size: 15px; font-weight: 700;
    cursor: pointer; margin-top: 8px; transition: background 0.2s;
  }
  button:hover { background: #ea580c; }
</style>
</head>
<body>
<div class="card">
  <h2>Contact Us</h2>
  <p class="subtitle">Fill out the form below and we'll get back to you shortly.</p>
  <div class="row">
    <div class="field">
      <label>First Name</label>
      <input type="text" placeholder="John" />
    </div>
    <div class="field">
      <label>Last Name</label>
      <input type="text" placeholder="Doe" />
    </div>
  </div>
  <div class="field">
    <label>Email Address</label>
    <input type="email" placeholder="john@example.com" />
  </div>
  <div class="field">
    <label>Phone Number <span class="required">*</span></label>
    <input type="tel" placeholder="+1 (555) 000-0000" required />
  </div>
  <div class="field">
    <label>Message</label>
    <textarea placeholder="Tell us how we can help…"></textarea>
  </div>
  <div class="field">
    <label>How did you hear about us?</label>
    <select>
      <option value="">Select an option</option>
      <option>Google</option>
      <option>Social Media</option>
      <option>Friend</option>
      <option>Other</option>
    </select>
  </div>
  <button type="submit">Send Message</button>
</div>
</body>
</html>`;

// ─── Sub-components ───────────────────────────────────────────────────────────

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
            <Avatar
                size={32}
                icon={isAi ? <RobotOutlined /> : <UserOutlined />}
                style={{
                    background: isAi ? '#111' : '#f97316',
                    flexShrink: 0,
                    fontSize: 14,
                }}
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
            <div style={{
                background: '#f4f4f5', borderRadius: '4px 14px 14px 14px',
                padding: '12px 16px', display: 'flex', gap: 5, alignItems: 'center',
            }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%', background: '#aaa',
                        animation: 'bounce 1.2s infinite',
                        animationDelay: `${i * 0.2}s`,
                    }} />
                ))}
                <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }`}</style>
            </div>
        </div>
    );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

export default function AiFormDrawer({ open, onClose }) {
    const [messages, setMessages]     = useState(MOCK_MESSAGES);
    const [input, setInput]           = useState('');
    const [thinking, setThinking]     = useState(false);
    const [htmlContent, setHtml]      = useState(MOCK_HTML);
    const [viewport, setViewport]     = useState('desktop');
    const [formTitle, setFormTitle]   = useState('Contact Form');
    const [editingTitle, setEditing]  = useState(false);
    const messagesEndRef              = useRef(null);
    const inputRef                    = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, thinking]);

    const handleSend = () => {
        const text = input.trim();
        if (!text || thinking) return;
        setInput('');
        setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: text }]);
        setThinking(true);
        // Backend call goes here — mocked with timeout
        setTimeout(() => {
            setThinking(false);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                content: "I've updated the form based on your request. The preview on the right reflects your changes.",
            }]);
        }, 1800);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
    };

    const copyEmbedCode = () => {
        navigator.clipboard.writeText(`<script src="https://promptform.mesh99.com/widget.js" data-form-id="FORM_ULID"><\/script>`);
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
                background: '#fff', flexShrink: 0, zIndex: 10,
            }}>
                <Button icon={<ArrowLeftOutlined />} type="text" onClick={onClose} style={{ fontWeight: 600, color: '#555' }}>
                    Back to Forms
                </Button>

                {/* Editable form title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {editingTitle ? (
                        <Input
                            autoFocus
                            size="small"
                            value={formTitle}
                            onChange={e => setFormTitle(e.target.value)}
                            onBlur={() => setEditing(false)}
                            onPressEnter={() => setEditing(false)}
                            style={{ width: 220, fontWeight: 700, fontSize: 15 }}
                        />
                    ) : (
                        <Text strong style={{ fontSize: 15 }}>{formTitle}</Text>
                    )}
                    <Button
                        type="text" size="small" icon={<EditOutlined />}
                        onClick={() => setEditing(true)}
                        style={{ color: '#bbb' }}
                    />
                </div>

                <Space>
                    <Button icon={<SaveOutlined />}>Save Draft</Button>
                    <Button type="primary" icon={<CheckOutlined />}>Publish</Button>
                </Space>
            </div>

            {/* ── Body ── */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* ── Chat Panel (40%) ── */}
                <div style={{
                    width: '40%', minWidth: 360,
                    display: 'flex', flexDirection: 'column',
                    borderRight: '1px solid #f0f0f0', background: '#fff',
                }}>
                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 8px' }}>
                        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
                        {thinking && <ThinkingBubble />}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{ padding: '12px 16px 16px', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <TextArea
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Describe changes or ask for a new form…"
                                autoSize={{ minRows: 2, maxRows: 5 }}
                                style={{ paddingRight: 48, borderRadius: 10, fontSize: 13.5, resize: 'none' }}
                                disabled={thinking}
                            />
                            <Button
                                type="primary"
                                icon={thinking ? <LoadingOutlined /> : <SendOutlined />}
                                onClick={handleSend}
                                disabled={!input.trim() || thinking}
                                style={{
                                    position: 'absolute', right: 8, bottom: 8,
                                    width: 34, height: 34, borderRadius: 8, padding: 0,
                                }}
                            />
                        </div>
                        <Text type="secondary" style={{ fontSize: 11, marginTop: 6, display: 'block' }}>
                            ⌘ + Enter to send
                        </Text>
                    </div>
                </div>

                {/* ── Preview Panel (60%) ── */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f5f5f5', overflow: 'hidden' }}>
                    {/* Preview toolbar */}
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
                                    <Button
                                        icon={<DesktopOutlined />}
                                        type={viewport === 'desktop' ? 'primary' : 'default'}
                                        onClick={() => setViewport('desktop')}
                                    />
                                </Tooltip>
                                <Tooltip title="Mobile">
                                    <Button
                                        icon={<MobileOutlined />}
                                        type={viewport === 'mobile' ? 'primary' : 'default'}
                                        onClick={() => setViewport('mobile')}
                                    />
                                </Tooltip>
                            </Button.Group>
                            <Tooltip title="Copy embed code">
                                <Button size="small" icon={<CopyOutlined />} onClick={copyEmbedCode}>
                                    Embed Code
                                </Button>
                            </Tooltip>
                        </Space>
                    </div>

                    {/* iframe container */}
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'flex-start',
                        justifyContent: 'center', padding: 32, overflow: 'auto',
                    }}>
                        <div style={{
                            width: viewport === 'mobile' ? 375 : '100%',
                            maxWidth: viewport === 'mobile' ? 375 : 800,
                            height: viewport === 'mobile' ? 700 : '100%',
                            minHeight: 500,
                            background: '#fff',
                            borderRadius: 12,
                            overflow: 'hidden',
                            boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
                            transition: 'width 0.3s, max-width 0.3s',
                            flexShrink: 0,
                        }}>
                            <iframe
                                title="Form Preview"
                                srcDoc={htmlContent}
                                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                                sandbox="allow-forms allow-scripts"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Drawer>
    );
}
