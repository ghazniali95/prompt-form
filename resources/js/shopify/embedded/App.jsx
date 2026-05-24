import React, { useState, useEffect } from 'react';
import { Frame, Spinner } from '@shopify/polaris';
import { useAuthenticatedFetch } from './hooks/useAuthenticatedFetch';
import FormsIndex from './FormsIndex';
import FormBuilder from './FormBuilder';
import PricingPage from './PricingPage';
import OnboardingPage from './OnboardingPage';

function getInitialPage() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('billing_success') || params.get('billing_error')) return 'pricing';
    if (window.location.pathname === '/shopify/pricing') return 'pricing';
    return 'forms';
}

export default function App() {
    const api = useAuthenticatedFetch();
    const [onboardingChecked, setOnboardingChecked] = useState(false);
    const [needsOnboarding, setNeedsOnboarding]     = useState(false);
    const [currentPage, setCurrentPage]             = useState(getInitialPage);
    const [editingFormId, setEditingFormId]         = useState(null);

    useEffect(() => {
        api.get('/api/v1/onboarding/status')
            .then(({ data }) => setNeedsOnboarding(data.data.needs_onboarding))
            .catch(() => {})
            .finally(() => setOnboardingChecked(true));
    }, []);

    const navigate = (page, formId = null) => {
        setCurrentPage(page);
        setEditingFormId(formId);
    };

    const navigateToPricing = () => navigate('pricing');

    if (!onboardingChecked) {
        return (
            <Frame>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <Spinner size="large" />
                </div>
            </Frame>
        );
    }

    if (needsOnboarding) {
        return (
            <Frame>
                <OnboardingPage onDone={() => setNeedsOnboarding(false)} />
            </Frame>
        );
    }

    const renderPage = () => {
        if (currentPage === 'builder') {
            return <FormBuilder formId={editingFormId} onBack={() => navigate('forms')} onNavigatePricing={navigateToPricing} />;
        }
        if (currentPage === 'pricing') {
            return <PricingPage onBack={() => navigate('forms')} />;
        }
        return <FormsIndex onCreateNew={() => navigate('builder')} onEdit={(id) => navigate('builder', id)} onNavigatePricing={navigateToPricing} />;
    };

    return (
        <Frame>
            {renderPage()}
        </Frame>
    );
}
