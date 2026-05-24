import React, { useState, useEffect } from 'react';
import {
    Page, Card, BlockStack, InlineStack, InlineGrid,
    Text, Button, TextField, Banner, Spinner, Badge,
    Box, Divider,
} from '@shopify/polaris';
import { useAuthenticatedFetch } from './hooks/useAuthenticatedFetch';

const SCAN_STEPS = [
    'Fetching your storefront…',
    'Extracting brand colours…',
    'Analysing your brand identity…',
    'Almost done…',
];

// ── Color swatch ──────────────────────────────────────────────────────────────

function ColorField({ label, value, onChange }) {
    return (
        <div>
            <Text variant="bodySm" fontWeight="semibold" as="p" tone="subdued">{label}</Text>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                    type="color"
                    value={value || '#f97316'}
                    onChange={e => onChange(e.target.value)}
                    style={{ width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2, background: 'transparent' }}
                />
                <TextField
                    value={value || ''}
                    onChange={onChange}
                    placeholder="#000000"
                    autoComplete="off"
                />
            </div>
        </div>
    );
}

// ── Brand preview strip ───────────────────────────────────────────────────────

function BrandPreview({ data }) {
    const colors = [data.primary_color, data.secondary_color, data.accent_color].filter(Boolean);
    if (!data.company_name && !data.logo_url && !colors.length) return null;

    return (
        <Box background="bg-surface-secondary" borderRadius="200" padding="300">
            <InlineStack gap="300" blockAlign="center" wrap={false}>
                {data.favicon_url && (
                    <img src={data.favicon_url} alt="" style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }}
                        onError={e => { e.target.style.display = 'none'; }} />
                )}
                {data.logo_url && (
                    <img src={data.logo_url} alt="logo" style={{ maxHeight: 32, maxWidth: 100, objectFit: 'contain', flexShrink: 0 }}
                        onError={e => { e.target.style.display = 'none'; }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Text variant="bodyMd" fontWeight="semibold" truncate>{data.company_name || 'Your Store'}</Text>
                    {data.website_url && (
                        <Text variant="bodySm" tone="subdued" truncate>{data.website_url}</Text>
                    )}
                </div>
                {colors.length > 0 && (
                    <InlineStack gap="150">
                        {colors.map((c, i) => (
                            <div key={i} style={{ width: 20, height: 20, borderRadius: 4, background: c, border: '1px solid rgba(0,0,0,0.1)' }} />
                        ))}
                    </InlineStack>
                )}
            </InlineStack>
        </Box>
    );
}

// ── Step 1: URL input + scanning ──────────────────────────────────────────────

function StepScan({ api, onScanned, onSkip }) {
    const [url, setUrl]           = useState(`https://${window.__shopDomain || ''}`);
    const [scanning, setScanning] = useState(false);
    const [scanStep, setScanStep] = useState(0);
    const [error, setError]       = useState('');

    useEffect(() => {
        if (!scanning) return;
        const id = setInterval(() => setScanStep(p => p < SCAN_STEPS.length - 1 ? p + 1 : p), 1400);
        return () => clearInterval(id);
    }, [scanning]);

    const handleScan = async () => {
        const trimmed = url.trim();
        if (!trimmed) return;
        setError('');
        setScanning(true);
        setScanStep(0);
        try {
            const { data } = await api.post('/api/v1/onboarding/scan', { url: trimmed });
            onScanned(data.data);
        } catch (err) {
            setError(err?.response?.data?.error ?? 'Could not scan the website. Please check the URL and try again.');
        } finally {
            setScanning(false);
        }
    };

    return (
        <Card>
            <BlockStack gap="500">
                <BlockStack gap="200">
                    <Text variant="headingLg" as="h2">Set up your workspace</Text>
                    <Text tone="subdued">
                        We've pre-filled your store URL. Hit Scan and we'll pull your brand colours, logo, and company info automatically.
                    </Text>
                </BlockStack>

                {scanning ? (
                    <Box paddingBlock="800">
                        <BlockStack gap="400" inlineAlign="center">
                            <Spinner size="large" />
                            <Text tone="subdued" alignment="center">{SCAN_STEPS[scanStep]}</Text>
                        </BlockStack>
                    </Box>
                ) : (
                    <BlockStack gap="400">
                        {error && <Banner tone="critical" onDismiss={() => setError('')}>{error}</Banner>}

                        <TextField
                            label="Website URL"
                            value={url}
                            onChange={setUrl}
                            placeholder="https://yourstore.myshopify.com"
                            autoComplete="off"
                            connectedRight={
                                <Button variant="primary" onClick={handleScan} disabled={!url.trim()}>
                                    Scan
                                </Button>
                            }
                        />

                        <InlineStack align="start">
                            <Button variant="plain" tone="subdued" onClick={onSkip}>
                                Skip and set up manually
                            </Button>
                        </InlineStack>
                    </BlockStack>
                )}
            </BlockStack>
        </Card>
    );
}

// ── Step 2: Review & edit ─────────────────────────────────────────────────────

function StepReview({ api, data: initialData, onDone, onSkip }) {
    const [form, setForm]     = useState(initialData);
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState('');

    const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const handleComplete = async () => {
        setSaving(true);
        setError('');
        try {
            await api.post('/api/v1/onboarding/complete', form);
            onDone();
        } catch {
            setError('Failed to save. Please try again.');
            setSaving(false);
        }
    };

    return (
        <Card>
            <BlockStack gap="500">
                <BlockStack gap="200">
                    <Text variant="headingLg" as="h2">Your brand identity</Text>
                    <Text tone="subdued">Review and adjust what we found. You can always change this later.</Text>
                </BlockStack>

                {error && <Banner tone="critical" onDismiss={() => setError('')}>{error}</Banner>}

                <BrandPreview data={form} />

                <Divider />

                <InlineGrid columns={2} gap="400">
                    <TextField
                        label="Company name"
                        value={form.company_name || ''}
                        onChange={val => update('company_name', val)}
                        placeholder="Your store name"
                        autoComplete="off"
                    />
                    <TextField
                        label="Font family"
                        value={form.font_family || ''}
                        onChange={val => update('font_family', val)}
                        placeholder="e.g. Inter, Roboto"
                        autoComplete="off"
                    />
                    <TextField
                        label="Logo URL"
                        value={form.logo_url || ''}
                        onChange={val => update('logo_url', val)}
                        placeholder="https://…"
                        autoComplete="off"
                    />
                    <TextField
                        label="Favicon URL"
                        value={form.favicon_url || ''}
                        onChange={val => update('favicon_url', val)}
                        placeholder="https://…"
                        autoComplete="off"
                    />
                </InlineGrid>

                <TextField
                    label="What your store does"
                    value={form.description || ''}
                    onChange={val => update('description', val)}
                    placeholder="A short description of your store…"
                    multiline={3}
                    autoComplete="off"
                />

                <BlockStack gap="300">
                    <Text variant="bodySm" fontWeight="semibold" as="p" tone="subdued">Brand colours</Text>
                    <InlineGrid columns={3} gap="400">
                        <ColorField label="Primary"   value={form.primary_color}   onChange={val => update('primary_color',   val)} />
                        <ColorField label="Secondary" value={form.secondary_color} onChange={val => update('secondary_color', val)} />
                        <ColorField label="Accent"    value={form.accent_color}    onChange={val => update('accent_color',    val)} />
                    </InlineGrid>
                </BlockStack>

                <Divider />

                <InlineStack align="end" gap="300">
                    <Button onClick={onSkip}>Skip for now</Button>
                    <Button variant="primary" onClick={handleComplete} loading={saving}>
                        Apply & go to dashboard
                    </Button>
                </InlineStack>
            </BlockStack>
        </Card>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OnboardingPage({ onDone }) {
    const api = useAuthenticatedFetch();
    const [step, setStep]       = useState(0); // 0 = scan, 1 = review
    const [scanned, setScanned] = useState(null);

    const handleSkip = async () => {
        try {
            await api.post('/api/v1/onboarding/skip');
        } catch {}
        onDone();
    };

    const handleScanned = (data) => {
        setScanned(data);
        setStep(1);
    };

    return (
        <Page title="Welcome to PromptForm">
            <BlockStack gap="400">
                <InlineStack gap="200" blockAlign="center">
                    <Badge tone={step === 0 ? 'info' : 'success'}>Step 1 — Scan website</Badge>
                    <Text tone="subdued">→</Text>
                    <Badge tone={step === 1 ? 'info' : 'new'}>Step 2 — Review brand</Badge>
                </InlineStack>

                {step === 0 && (
                    <StepScan api={api} onScanned={handleScanned} onSkip={handleSkip} />
                )}
                {step === 1 && scanned && (
                    <StepReview api={api} data={scanned} onDone={onDone} onSkip={handleSkip} />
                )}
            </BlockStack>
        </Page>
    );
}
