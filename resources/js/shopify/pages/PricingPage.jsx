import React, { useState, useEffect } from 'react';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import {
    Page,
    Card,
    BlockStack,
    InlineGrid,
    InlineStack,
    Text,
    Button,
    Badge,
    Divider,
    Banner,
    Box,

} from '@shopify/polaris';

const PLANS = [
    {
        id: 'starter',
        name: 'Starter',
        price: 9,
        description: 'For small stores ready to start collecting responses.',
        features: [
            { label: 'Up to 5 forms' },
            { label: 'Up to 1,000 submissions' },
            { label: '2x AI usage per month' },
        ],
        cta: 'Subscribe to Starter',
    },
    {
        id: 'growing',
        name: 'Growing',
        price: 24,
        description: 'For growing stores that need unlimited scale.',
        features: [
            { label: 'Unlimited forms' },
            { label: 'Unlimited submissions' },
            { label: '10x AI usage per month' },
        ],
        cta: 'Subscribe to Growing',
    },
];

function PlanCard({ plan, currentPlanId, onSubscribe, onCancel, loading }) {
    const isCurrent = currentPlanId === plan.id;
    const isHigherPlan = currentPlanId === 'starter' && plan.id === 'growing';
    const isLowerPlan  = currentPlanId === 'growing'  && plan.id === 'starter';

    return (
        <div style={{ position: 'relative' }}>
            <div style={{
                borderRadius: 'var(--p-border-radius-300, 12px)',
                border: plan.id === 'growing'
                    ? '2px solid #008060'
                    : '1px solid var(--p-color-border-subdued, #e4e5e7)',
                overflow: 'hidden',
                height: '100%',
            }}>
                <Card>
                    <BlockStack gap="500">

                        {/* Header */}
                        <BlockStack gap="100">
                            <InlineStack align="space-between" blockAlign="center">
                                <Text variant="headingLg" as="h2">{plan.name}</Text>
                                {isCurrent && <Badge tone="info">Current plan</Badge>}
                            </InlineStack>
                            <Text tone="subdued" variant="bodySm">{plan.description}</Text>
                        </BlockStack>

                        {/* Price */}
                        <InlineStack blockAlign="end" gap="100">
                            <Text variant="heading3xl" as="p" fontWeight="bold">
                                ${plan.price}
                            </Text>
                            <div style={{ paddingBottom: 4 }}>
                                <Text tone="subdued">/ month</Text>
                            </div>
                        </InlineStack>

                        <Divider />

                        {/* Features */}
                        <BlockStack gap="300">
                            {plan.features.map((f) => (
                                <InlineStack key={f.label} gap="200" blockAlign="center">
                                    <span style={{ color: '#008060', fontWeight: 700, fontSize: 15, lineHeight: 1 }}>✓</span>
                                    <Text>{f.label}</Text>
                                </InlineStack>
                            ))}
                        </BlockStack>

                        {/* CTA */}
                        <BlockStack gap="200">
                            {isCurrent ? (
                                <Button
                                    variant="plain"
                                    tone="critical"
                                    onClick={() => onCancel(plan)}
                                    loading={loading === `cancel-${plan.id}`}
                                >
                                    Cancel subscription
                                </Button>
                            ) : isLowerPlan ? (
                                <Button disabled fullWidth>
                                    Downgrade not available
                                </Button>
                            ) : plan.id === 'growing' ? (
                                    <button
                                        onClick={() => onSubscribe(plan)}
                                        disabled={loading === `subscribe-${plan.id}`}
                                        style={{
                                            width: '100%',
                                            padding: '10px 16px',
                                            backgroundColor: '#1a1a1a',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 'var(--p-border-radius-200, 8px)',
                                            fontSize: 14,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            opacity: loading === `subscribe-${plan.id}` ? 0.6 : 1,
                                        }}
                                    >
                                        {plan.cta}
                                    </button>
                                ) : (
                                    <Button
                                        variant="secondary"
                                        fullWidth
                                        onClick={() => onSubscribe(plan)}
                                        loading={loading === `subscribe-${plan.id}`}
                                    >
                                        {plan.cta}
                                    </Button>
                                )}
                        </BlockStack>

                    </BlockStack>
                </Card>
            </div>
        </div>
    );
}

export default function PricingPage({ onBack }) {
    const api = useAuthenticatedFetch();
    const [currentPlanId, setCurrentPlanId] = useState(null);
    const [planLoading, setPlanLoading] = useState(true);
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    useEffect(() => {
        // Check for success/error from billing callback redirect
        const params = new URLSearchParams(window.location.search);
        if (params.get('billing_success')) {
            setSuccessMsg(`You're now on the ${params.get('billing_success')} plan!`);
        }

        api.get('/api/shopify/billing/current')
            .then(({ data }) => setCurrentPlanId(data.data.plan))
            .catch(() => {})
            .finally(() => setPlanLoading(false));
    }, []);

    const handleSubscribe = async (plan) => {
        setLoading(`subscribe-${plan.id}`);
        setError(null);
        try {
            const { data } = await api.post('/api/shopify/billing/subscribe', { plan: plan.id });
            // App Bridge v4 patches window.open to handle cross-origin parent-frame
            // navigation correctly. window.top.location.href is blocked by browsers
            // for cross-origin iframes; open(url, '_top') is the supported way.
            open(data.data.confirmation_url, '_top');
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to start subscription. Please try again.');
            setLoading(null);
        }
    };

    const handleCancel = async (plan) => {
        setLoading(`cancel-${plan.id}`);
        setError(null);
        try {
            await api.post('/api/shopify/billing/cancel');
            setCurrentPlanId('free');
            setSuccessMsg('Your subscription has been cancelled. You\'ve been moved to the free plan.');
        } catch {
            setError('Failed to cancel subscription. Please try again.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <Page title="Pricing" backAction={{ content: 'Forms', onAction: onBack }}>
            <BlockStack gap="600">

                {error      && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}
                {successMsg && <Banner tone="success"  onDismiss={() => setSuccessMsg(null)}>{successMsg}</Banner>}

                {/* Heading */}
                <BlockStack gap="200">
                    <Text variant="headingXl" as="h1" alignment="center">
                        Simple, transparent pricing
                    </Text>
                    <Text tone="subdued" alignment="center">
                        Start free, upgrade when you're ready. Cancel anytime.
                    </Text>
                </BlockStack>

                {/* Plan cards */}
                <InlineGrid columns={2} gap="500">
                    {PLANS.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            currentPlanId={currentPlanId}
                            onSubscribe={handleSubscribe}
                            onCancel={handleCancel}
                            loading={loading}
                        />
                    ))}
                </InlineGrid>

                {/* Footer */}
                <Box paddingBlockEnd="800">
                    <BlockStack gap="100">
                        <Text tone="subdued" alignment="center" variant="bodySm">
                            All plans billed monthly. No annual commitment required.
                        </Text>
                    </BlockStack>
                </Box>

            </BlockStack>
        </Page>
    );
}
