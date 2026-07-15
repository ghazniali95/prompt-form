import React, { useState, useEffect } from 'react';
import {
    Page, Card, BlockStack, InlineStack,
    Text, Button, Banner, Spinner, Box,
} from '@shopify/polaris';
import { useAuthenticatedFetch } from './hooks/useAuthenticatedFetch';

const SETUP_STEPS = [
    'Connecting to your store…',
    'Capturing your storefront…',
    'Getting your workspace ready…',
    'Almost done…',
];

// Shopify merchants already have a known storefront URL, so onboarding is fully
// automatic: we complete setup (which captures a screenshot of the store in the
// background for AI brand styling) and move straight to the dashboard.
export default function OnboardingPage({ onDone }) {
    const api = useAuthenticatedFetch();
    const [working, setWorking] = useState(true);
    const [step, setStep]       = useState(0);
    const [error, setError]     = useState('');

    useEffect(() => {
        if (!working) return;
        const id = setInterval(() => setStep(p => (p < SETUP_STEPS.length - 1 ? p + 1 : p)), 1200);
        return () => clearInterval(id);
    }, [working]);

    const runSetup = async () => {
        setError('');
        setWorking(true);
        setStep(0);
        try {
            // Server resolves the storefront URL from the connected shop.
            await api.post('/api/v1/onboarding/complete', {});
            onDone();
        } catch (err) {
            setError(err?.response?.data?.error ?? 'Could not finish setup. Please try again.');
            setWorking(false);
        }
    };

    const handleSkip = async () => {
        try {
            await api.post('/api/v1/onboarding/skip');
        } catch {}
        onDone();
    };

    // Kick off setup on mount.
    useEffect(() => { runSetup(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Page title="Welcome to PromptForm">
            <Card>
                <BlockStack gap="500">
                    <BlockStack gap="200">
                        <Text variant="headingLg" as="h2">Setting up your workspace</Text>
                        <Text tone="subdued">
                            We&rsquo;re getting things ready so your AI-generated forms match your store&rsquo;s look and feel.
                        </Text>
                    </BlockStack>

                    {working ? (
                        <Box paddingBlock="800">
                            <BlockStack gap="400" inlineAlign="center">
                                <Spinner size="large" />
                                <Text tone="subdued" alignment="center">{SETUP_STEPS[step]}</Text>
                            </BlockStack>
                        </Box>
                    ) : (
                        <BlockStack gap="400">
                            {error && <Banner tone="critical" onDismiss={() => setError('')}>{error}</Banner>}

                            <InlineStack align="start" gap="300">
                                <Button variant="primary" onClick={runSetup}>Try again</Button>
                                <Button variant="plain" tone="subdued" onClick={handleSkip}>
                                    Skip for now
                                </Button>
                            </InlineStack>
                        </BlockStack>
                    )}
                </BlockStack>
            </Card>
        </Page>
    );
}
