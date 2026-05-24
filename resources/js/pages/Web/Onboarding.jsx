import React, { useState, useEffect } from 'react';
import {
    Button, Input, Typography, message, Steps,
    ColorPicker, Spin, Alert, Upload,
} from 'antd';
import {
    GlobalOutlined, ArrowRightOutlined, CheckOutlined,
    LoadingOutlined, DoubleRightOutlined, RobotOutlined,
    UploadOutlined, LinkOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const SCAN_STEPS = [
    'Fetching your website…',
    'Extracting brand colors…',
    'Analysing your brand identity…',
    'Almost done…',
];

function BrandPreview({ data }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0', marginBottom: 24 }}>
            {data.favicon_url && (
                <img src={data.favicon_url} alt="favicon" style={{ width: 20, height: 20, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
            )}
            {data.logo_url && (
                <img src={data.logo_url} alt="logo" style={{ maxHeight: 36, maxWidth: 120, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
                <Text strong style={{ fontSize: 14 }}>{data.company_name || 'Your Company'}</Text>
                {data.website_url && (
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{data.website_url}</Text>
                )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
                {[data.primary_color, data.secondary_color, data.accent_color].filter(Boolean).map((c, i) => (
                    <div key={i} style={{ width: 20, height: 20, borderRadius: 4, background: c, border: '1px solid #e0e0e0' }} />
                ))}
            </div>
        </div>
    );
}

// ── Step 1: URL input + scanning ─────────────────────────────────────────────

function StepScan({ onScanned, onSkip }) {
    const [url, setUrl]           = useState('');
    const [scanning, setScanning] = useState(false);
    const [scanStep, setScanStep] = useState(0);
    const [error, setError]       = useState('');

    useEffect(() => {
        if (!scanning) return;
        const interval = setInterval(() => {
            setScanStep(prev => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
        }, 1400);
        return () => clearInterval(interval);
    }, [scanning]);

    const handleScan = async () => {
        const trimmed = url.trim();
        if (!trimmed) return;
        setError('');
        setScanning(true);
        setScanStep(0);
        try {
            const { data } = await axios.post('/api/v1/onboarding/scan', { url: trimmed });
            onScanned(data.data);
        } catch (err) {
            setError(err.response?.data?.error ?? 'Could not scan the website. Please check the URL and try again.');
        } finally {
            setScanning(false);
        }
    };

    return (
        <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
            <div style={{
                width: 64, height: 64, borderRadius: 18, background: '#f97316',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
            }}>
                <RobotOutlined style={{ fontSize: 30, color: '#fff' }} />
            </div>

            <Title level={2} style={{ fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
                Set up your workspace
            </Title>
            <Text type="secondary" style={{ fontSize: 15, display: 'block', marginBottom: 36 }}>
                Enter your website URL and we'll automatically pull your brand colours, logo, and company info.
            </Text>

            {scanning ? (
                <div style={{ padding: '40px 0' }}>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 36, color: '#f97316' }} />} />
                    <div style={{ marginTop: 20, fontSize: 15, fontWeight: 500, color: '#555' }}>
                        {SCAN_STEPS[scanStep]}
                    </div>
                </div>
            ) : (
                <>
                    {error && (
                        <Alert type="error" message={error} showIcon style={{ marginBottom: 20, borderRadius: 10 }} />
                    )}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                        <Input
                            size="large"
                            prefix={<GlobalOutlined style={{ color: '#ccc' }} />}
                            placeholder="yourwebsite.com or https://yourwebsite.com"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            onPressEnter={handleScan}
                            style={{ borderRadius: 10, flex: 1 }}
                        />
                        <Button
                            type="primary"
                            size="large"
                            icon={<ArrowRightOutlined />}
                            onClick={handleScan}
                            disabled={!url.trim()}
                            style={{ borderRadius: 10, fontWeight: 700, background: '#f97316', borderColor: '#f97316' }}
                        >
                            Scan
                        </Button>
                    </div>
                    <Button type="link" icon={<DoubleRightOutlined />} onClick={onSkip} style={{ color: '#aaa', fontSize: 13 }}>
                        Skip and set up manually
                    </Button>
                </>
            )}
        </div>
    );
}

// ── Logo upload component ─────────────────────────────────────────────────────

function LogoUpload({ value, onChange }) {
    const [uploading, setUploading] = useState(false);
    const [mode, setMode]           = useState('url'); // 'url' | 'upload'

    const handleUpload = async ({ file, onSuccess, onError }) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('logo', file);
        try {
            const { data } = await axios.post('/api/v1/onboarding/upload-logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onChange(data.data.url);
            onSuccess(data);
            message.success('Logo uploaded successfully.');
        } catch (err) {
            onError(err);
            message.error(err.response?.data?.message ?? 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <Button
                    size="small"
                    type={mode === 'url' ? 'primary' : 'default'}
                    icon={<LinkOutlined />}
                    onClick={() => setMode('url')}
                    style={{ fontSize: 12 }}
                >
                    URL
                </Button>
                <Button
                    size="small"
                    type={mode === 'upload' ? 'primary' : 'default'}
                    icon={<UploadOutlined />}
                    onClick={() => setMode('upload')}
                    style={{ fontSize: 12 }}
                >
                    Upload
                </Button>
            </div>

            {mode === 'url' ? (
                <Input
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder="https://…"
                    style={{ borderRadius: 8 }}
                />
            ) : (
                <Upload
                    accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
                    customRequest={handleUpload}
                    showUploadList={false}
                    maxCount={1}
                >
                    <Button
                        icon={uploading ? <LoadingOutlined /> : <UploadOutlined />}
                        loading={uploading}
                        style={{ borderRadius: 8, width: '100%' }}
                    >
                        {uploading ? 'Uploading…' : 'Choose image'}
                    </Button>
                </Upload>
            )}

            {value && (
                <img
                    src={value}
                    alt="logo preview"
                    style={{ height: 32, marginTop: 8, objectFit: 'contain', display: 'block' }}
                    onError={e => e.target.style.display = 'none'}
                />
            )}
        </div>
    );
}

// ── Step 2: Review & edit ─────────────────────────────────────────────────────

function StepReview({ data: initialData, onComplete, onSkip }) {
    const [form, setForm]     = useState(initialData);
    const [saving, setSaving] = useState(false);

    const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const handleComplete = async () => {
        setSaving(true);
        try {
            const { data } = await axios.post('/api/v1/onboarding/complete', form);
            window.location.href = data.redirect;
        } catch {
            message.error('Failed to save. Please try again.');
            setSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <Title level={2} style={{ fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
                    Your brand identity
                </Title>
                <Text type="secondary" style={{ fontSize: 15 }}>
                    Review and adjust what we found. You can always change this later.
                </Text>
            </div>

            <BrandPreview data={form} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                {/* Company name */}
                <div>
                    <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Company name</Text>
                    <Input
                        value={form.company_name || ''}
                        onChange={e => update('company_name', e.target.value)}
                        placeholder="Your company name"
                        style={{ borderRadius: 8 }}
                    />
                </div>

                {/* Font */}
                <div>
                    <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Font family</Text>
                    <Input
                        value={form.font_family || ''}
                        onChange={e => update('font_family', e.target.value)}
                        placeholder="e.g. Inter, Roboto"
                        style={{ borderRadius: 8 }}
                    />
                </div>

                {/* Logo */}
                <div>
                    <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Logo</Text>
                    <LogoUpload value={form.logo_url} onChange={val => update('logo_url', val)} />
                </div>

                {/* Favicon URL */}
                <div>
                    <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Favicon URL</Text>
                    <Input
                        value={form.favicon_url || ''}
                        onChange={e => update('favicon_url', e.target.value)}
                        placeholder="https://…"
                        style={{ borderRadius: 8 }}
                    />
                    {form.favicon_url && (
                        <img src={form.favicon_url} alt="favicon" style={{ height: 20, marginTop: 8, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
                    )}
                </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>What your company does</Text>
                <Input.TextArea
                    value={form.description || ''}
                    onChange={e => update('description', e.target.value)}
                    placeholder="A short description of your company…"
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    style={{ borderRadius: 8 }}
                />
            </div>

            {/* Colors */}
            <div style={{ marginBottom: 32 }}>
                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>Brand colours</Text>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    {[
                        { key: 'primary_color',   label: 'Primary'   },
                        { key: 'secondary_color', label: 'Secondary' },
                        { key: 'accent_color',    label: 'Accent'    },
                    ].map(({ key, label }) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <ColorPicker
                                value={form[key] || '#f97316'}
                                onChange={(color) => update(key, color.toHexString())}
                                size="middle"
                            />
                            <div>
                                <Text style={{ fontSize: 12, fontWeight: 600, display: 'block' }}>{label}</Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>{form[key] || '—'}</Text>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <Button size="large" onClick={onSkip} style={{ borderRadius: 10 }}>
                    Skip for now
                </Button>
                <Button
                    type="primary"
                    size="large"
                    icon={saving ? <LoadingOutlined /> : <CheckOutlined />}
                    loading={saving}
                    onClick={handleComplete}
                    style={{ borderRadius: 10, fontWeight: 700, background: '#f97316', borderColor: '#f97316', minWidth: 200 }}
                >
                    Apply & Go to Dashboard
                </Button>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Onboarding({ user }) {
    const [step, setStep]       = useState(0);
    const [scanned, setScanned] = useState(null);
    const [skipping, setSkip]   = useState(false);

    const handleSkip = async () => {
        setSkip(true);
        try {
            const { data } = await axios.post('/api/v1/onboarding/skip');
            window.location.href = data.redirect;
        } catch {
            message.error('Something went wrong.');
            setSkip(false);
        }
    };

    const handleScanned = (data) => {
        setScanned(data);
        setStep(1);
    };

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', flexDirection: 'column' }}>
            {/* Top bar */}
            <div style={{ padding: '20px 40px', borderBottom: '1px solid #f0f0f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RobotOutlined style={{ color: '#fff', fontSize: 16 }} />
                    </div>
                    <Text strong style={{ fontSize: 16 }}>PromptForm</Text>
                </div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                    Welcome, {user.name}
                </Text>
            </div>

            {/* Steps indicator */}
            <div style={{ padding: '24px 40px 0', maxWidth: 800, margin: '0 auto', width: '100%' }}>
                <Steps
                    current={step}
                    size="small"
                    style={{ marginBottom: 40 }}
                    items={[
                        { title: 'Scan website' },
                        { title: 'Review brand' },
                    ]}
                />
            </div>

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '0 40px 60px' }}>
                <div style={{ width: '100%', maxWidth: 760 }}>
                    {step === 0 && (
                        <StepScan onScanned={handleScanned} onSkip={handleSkip} />
                    )}
                    {step === 1 && scanned && (
                        <StepReview data={scanned} onComplete={() => {}} onSkip={handleSkip} />
                    )}
                </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', padding: '16px 0', borderTop: '1px solid #f0f0f0', background: '#fff' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    Step {step + 1} of 2 — You can change everything from Settings later.
                </Text>
            </div>
        </div>
    );
}
