import React, { useEffect, useState } from 'react';
import {
    Page,
    Card,
    IndexTable,
    Text,
    Badge,
    Button,
    EmptyState,
    Spinner,
    Banner,
    InlineStack,
    BlockStack,
    InlineGrid,
    Popover,
    ActionList,
    Box,
    Divider,
} from '@shopify/polaris';
import { XSmallIcon, ThemeIcon } from '@shopify/polaris-icons';
import { MenuHorizontalIcon } from '@shopify/polaris-icons';

const ONBOARDING_KEY = 'pf_theme_onboarding_dismissed';
const CLIENT_ID = import.meta.env.VITE_SHOPIFY_CLIENT_ID ?? '';

function ThemeOnboardingCard({ shopDomain }) {
    const [dismissed, setDismissed] = useState(
        () => localStorage.getItem(ONBOARDING_KEY) === '1'
    );

    if (dismissed || !shopDomain) return null;

    const deepLink = `https://${shopDomain}/admin/themes/current/editor?template=index&addAppBlockId=${CLIENT_ID}/form&target=newAppsSection`;

    const steps = [
        'Create a form and publish it',
        'Open the form and click "Copy Form ID"',
        'Click "Open Theme Editor" below — the PromptForm block will be ready to add',
        'In the block settings, paste your Form ID and save',
    ];

    return (
        <Card>
            <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="start">
                    <BlockStack gap="100">
                        <Text variant="headingMd" as="h2">Add PromptForm to your theme</Text>
                        <Text variant="bodySm" tone="subdued">Follow these steps to display your form on your storefront</Text>
                    </BlockStack>
                    <Button
                        icon={XSmallIcon}
                        variant="plain"
                        accessibilityLabel="Dismiss"
                        onClick={() => { localStorage.setItem(ONBOARDING_KEY, '1'); setDismissed(true); }}
                    />
                </InlineStack>

                <Divider />

                <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="300">
                    {steps.map((step, i) => (
                        <BlockStack key={i} gap="200">
                            <InlineStack gap="200" blockAlign="start" wrap={false}>
                                <Box
                                    background="bg-surface-secondary"
                                    borderRadius="full"
                                    minWidth="24px"
                                    padding="100"
                                >
                                    <Text variant="bodySm" tone="subdued" fontWeight="bold" alignment="center">{i + 1}</Text>
                                </Box>
                                <Text variant="bodySm">{step}</Text>
                            </InlineStack>
                        </BlockStack>
                    ))}
                </InlineGrid>

                <InlineStack align="start">
                    <Button
                        variant="primary"
                        icon={ThemeIcon}
                        onClick={() => { window.open(deepLink, '_top'); }}
                    >
                        Open Theme Editor
                    </Button>
                </InlineStack>
            </BlockStack>
        </Card>
    );
}
import { useAuthenticatedFetch } from './hooks/useAuthenticatedFetch';
import FormPreview from './components/FormPreview';
import SubmissionsDrawer from './components/SubmissionsDrawer';

function AiUsageCard({ pct, used, limit, limitReached, onUpgrade }) {
    const barColor = limitReached ? '#B91C1C' : pct >= 80 ? '#B54708' : '#1A7F5A';
    const tone     = limitReached ? 'critical' : pct >= 80 ? 'caution' : 'success';
    const label    = limitReached ? 'Limit reached' : `${pct}% used this month`;

    return (
        <Card>
            <BlockStack gap="200">
                <Text variant="bodySm" tone="subdued">AI Usage</Text>
                <div style={{ height: 6, borderRadius: 3, background: '#e4e5e7', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: barColor, transition: 'width 0.4s ease' }} />
                </div>
                <InlineStack align="space-between">
                    <Text variant="bodySm" tone={tone}>{label}</Text>
                    {limitReached
                        ? <Button variant="plain" size="slim" onClick={onUpgrade}>Upgrade</Button>
                        : <Text variant="bodySm" tone="subdued">{used?.toLocaleString()} / {limit?.toLocaleString()} tokens</Text>
                    }
                </InlineStack>
            </BlockStack>
        </Card>
    );
}

function StatCard({ label, value, sublabel, tone }) {
    const valueColor = tone === 'warning' ? '#B54708' : tone === 'success' ? '#1A7F5A' : '#202223';
    return (
        <Card>
            <BlockStack gap="100">
                <Text variant="bodySm" tone="subdued">{label}</Text>
                <Text variant="heading2xl" as="p" fontWeight="bold">
                    <span style={{ color: valueColor }}>{value ?? '—'}</span>
                </Text>
                {sublabel && <Text variant="bodySm" tone="subdued">{sublabel}</Text>}
            </BlockStack>
        </Card>
    );
}

function BottomSheet({ open, onClose, title, children }) {
    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 519,
                    opacity: open ? 1 : 0,
                    pointerEvents: open ? 'auto' : 'none',
                    transition: 'opacity 0.35s ease',
                }}
            />

            {/* Sheet */}
            <div
                style={{
                    position: 'fixed',
                    top: '1%',
                    bottom: 0,
                    left: '1%',
                    right: '1%',
                    backgroundColor: 'var(--p-color-bg-surface, #fff)',
                    zIndex: 520,
                    transform: open ? 'translateY(0)' : 'translateY(101%)',
                    transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
                    borderRadius: 'var(--p-border-radius-300, 12px) var(--p-border-radius-300, 12px) 0 0',
                    boxShadow: 'var(--p-shadow-modal, 0 -2px 16px rgba(0,0,0,0.15))',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Drag handle */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px', flexShrink: 0 }}>
                    <div style={{
                        width: 36,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: 'var(--p-color-border, #8c9196)',
                    }} />
                </div>

                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 20px 14px',
                    borderBottom: '1px solid var(--p-color-border-subdued, #e4e5e7)',
                    flexShrink: 0,
                }}>
                    <Text variant="headingMd" as="h2">{title}</Text>
                    <Button icon={XSmallIcon} variant="plain" accessibilityLabel="Close" onClick={onClose} />
                </div>

                {/* Scrollable content */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '24px 20px' }}>
                    {children}
                </div>
            </div>
        </>
    );
}

export default function FormsIndex({ onCreateNew, onEdit, onNavigatePricing }) {
    const api = useAuthenticatedFetch();
    const [forms, setForms] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [previewForm, setPreviewForm] = useState(null);
    const [submissionsForm, setSubmissionsForm] = useState(null);
    const [activePopover, setActivePopover] = useState(null);
    const [limitError, setLimitError] = useState(null);
    const [submissionsBannerDismissed, setSubmissionsBannerDismissed] = useState(false);

    useEffect(() => {
        Promise.all([fetchForms(), fetchStats()]).finally(() => setLoading(false));
    }, []);

    const fetchForms = async () => {
        try {
            const { data } = await api.get('/api/v1/forms');
            setForms(data.data);
        } catch {
            setError('Failed to load forms.');
        }
    };

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/api/v1/stats');
            setStats(data.data);
        } catch {
            // Stats are non-critical — fail silently
        }
    };

    const handleCreateNew = () => {
        const formsLimit = stats?.forms_limit ?? null;
        if (formsLimit !== null && forms.length >= formsLimit) {
            setLimitError(`You've reached the ${formsLimit}-form limit on your current plan.`);
            return;
        }
        onCreateNew();
    };

    const handleTurnOff = async (form) => {
        setActivePopover(null);
        try {
            await api.post(`/api/v1/forms/${form.id}/unpublish`);
            setForms((prev) => prev.map((f) => f.id === form.id ? { ...f, is_published: false } : f));
        } catch {
            setError('Failed to unpublish form.');
        }
    };

    const handleDuplicate = async (form) => {
        setActivePopover(null);
        try {
            const { data } = await api.post(`/api/v1/forms/${form.id}/duplicate`);
            setForms((prev) => [data.data, ...prev]);
        } catch {
            setError('Failed to duplicate form.');
        }
    };

    if (loading) {
        return (
            <Page title="Forms">
                <Card>
                    <InlineStack align="center"><Spinner /></InlineStack>
                </Card>
            </Page>
        );
    }

    const submissionsLeft = stats?.submissions_left ?? null;
    const planLimit = stats?.plan_limit ?? null;
    const submissionsTone = submissionsLeft !== null && submissionsLeft <= 10 ? 'warning' : 'success';

    const rowMarkup = forms.map((form, index) => (
        <IndexTable.Row key={form.id} id={String(form.id)} position={index}>
            <IndexTable.Cell>
                <button
                    onClick={() => onEdit(form.id)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#202223', textDecoration: 'underline', font: 'inherit', fontWeight: 600 }}
                >
                    {form.title}
                </button>
            </IndexTable.Cell>
            <IndexTable.Cell>
                <Badge tone={form.is_published ? 'success' : 'attention'}>
                    {form.is_published ? 'Published' : 'Draft'}
                </Badge>
            </IndexTable.Cell>
            <IndexTable.Cell>
                <button
                    onClick={() => setSubmissionsForm(form)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', fontWeight: 700, color: '#202223', textDecoration: 'underline' }}
                >
                    {form.submissions ?? 0}
                </button>
            </IndexTable.Cell>
            <IndexTable.Cell>
                <Button variant="plain" onClick={() => setPreviewForm(form)}>Preview</Button>
            </IndexTable.Cell>
            <IndexTable.Cell>
                <Popover
                    active={activePopover === form.id}
                    activator={
                        <Button
                            icon={MenuHorizontalIcon}
                            variant="plain"
                            accessibilityLabel="More actions"
                            onClick={() => setActivePopover(activePopover === form.id ? null : form.id)}
                        />
                    }
                    onClose={() => setActivePopover(null)}
                >
                    <ActionList
                        items={[
                            {
                                content: 'Turn Off',
                                disabled: !form.is_published,
                                onAction: () => handleTurnOff(form),
                            },
                            {
                                content: 'View Submissions',
                                onAction: () => { setActivePopover(null); setSubmissionsForm(form); },
                            },
                            {
                                content: 'Refine with AI',
                                onAction: () => { setActivePopover(null); onEdit(form.id); },
                            },
                        ]}
                    />
                </Popover>
            </IndexTable.Cell>
        </IndexTable.Row>
    ));

    return (
        <Page
            title="Forms"
            primaryAction={{ content: 'Create form', onAction: handleCreateNew }}
        >
            <BlockStack gap="400">
                {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}

                {limitError && (
                    <Banner tone="warning" onDismiss={() => setLimitError(null)}>
                        <InlineStack gap="100" wrap={false}>
                            <span>{limitError}</span>
                            <Button variant="plain" onClick={onNavigatePricing}>View billing options</Button>
                        </InlineStack>
                    </Banner>
                )}

                {stats?.submissions_left === 0 && !submissionsBannerDismissed && (
                    <Banner tone="warning" onDismiss={() => setSubmissionsBannerDismissed(true)}>
                        <InlineStack gap="100" wrap={false}>
                            <span>Your form submissions are paused — you have reached your monthly limit.</span>
                            <Button variant="plain" onClick={onNavigatePricing}>View billing options</Button>
                        </InlineStack>
                    </Banner>
                )}

                <ThemeOnboardingCard shopDomain={window.__shopDomain} />

                {/* Analytics counters */}
                <InlineGrid columns={{ xs: 2, md: 4 }} gap="400">
                    <StatCard
                        label="Total Forms"
                        value={stats?.total_forms}
                        sublabel="forms created"
                    />
                    <StatCard
                        label="Total Submissions"
                        value={stats?.total_submissions}
                        sublabel="all time"
                    />
                    <StatCard
                        label="Submissions Left"
                        value={submissionsLeft}
                        sublabel={planLimit ? `of ${planLimit} free this month` : 'this month'}
                        tone={submissionsTone}
                    />
                    <AiUsageCard
                        pct={stats?.ai_usage_pct ?? 0}
                        used={stats?.ai_tokens_used ?? 0}
                        limit={stats?.ai_tokens_limit ?? 0}
                        limitReached={stats?.ai_limit_reached ?? false}
                        onUpgrade={onNavigatePricing}
                    />
                </InlineGrid>

                {forms.length === 0 ? (
                    <Card>
                        <EmptyState
                            heading="Create your first form"
                            action={{ content: 'Create form', onAction: handleCreateNew }}
                            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                        >
                            <p>Use AI prompts to build interactive forms for your store.</p>
                        </EmptyState>
                    </Card>
                ) : (
                    <Card padding="0">
                        <style>{`
                            .pf-forms-table table { table-layout: fixed; width: 100%; }
                            .pf-forms-table th:nth-child(2), .pf-forms-table td:nth-child(2) { width: 120px; }
                            .pf-forms-table th:nth-child(3), .pf-forms-table td:nth-child(3) { width: 120px; }
                            .pf-forms-table th:nth-child(4), .pf-forms-table td:nth-child(4) { width: 90px; }
                            .pf-forms-table th:nth-child(5), .pf-forms-table td:nth-child(5) { width: 50px; }
                        `}</style>
                        <div className="pf-forms-table">
                            <IndexTable
                                resourceName={{ singular: 'form', plural: 'forms' }}
                                itemCount={forms.length}
                                headings={[
                                    { title: 'Title' },
                                    { title: 'Status' },
                                    { title: 'Submissions' },
                                    { title: 'Preview' },
                                    { title: '' },
                                ]}
                                selectable={false}
                            >
                                {rowMarkup}
                            </IndexTable>
                        </div>
                    </Card>
                )}
            </BlockStack>

            <BottomSheet
                open={!!previewForm}
                onClose={() => setPreviewForm(null)}
                title={previewForm?.title || 'Form Preview'}
            >
                {previewForm && <FormPreview form={previewForm} />}
            </BottomSheet>

            <BottomSheet
                open={!!submissionsForm}
                onClose={() => setSubmissionsForm(null)}
                title={submissionsForm ? `${submissionsForm.title} — Submissions` : ''}
            >
                {submissionsForm && <SubmissionsDrawer form={submissionsForm} api={api} />}
            </BottomSheet>
        </Page>
    );
}
