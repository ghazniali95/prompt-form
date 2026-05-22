import React, { useState } from 'react';
import { Frame } from '@shopify/polaris';
import FormsIndex from './FormsIndex';
import FormBuilder from './FormBuilder';
import PricingPage from './PricingPage';

function getInitialPage() {
    // After a billing callback Shopify redirects to our app with billing_success
    // or billing_error in the query string — land on the pricing page to show it.
    const params = new URLSearchParams(window.location.search);
    if (params.get('billing_success') || params.get('billing_error')) return 'pricing';
    if (window.location.pathname === '/shopify/pricing') return 'pricing';
    return 'forms';
}

export default function App() {
    const [currentPage, setCurrentPage] = useState(getInitialPage);
    const [editingFormId, setEditingFormId] = useState(null);

    const navigate = (page, formId = null) => {
        setCurrentPage(page);
        setEditingFormId(formId);
    };

    const navigateToPricing = () => navigate('pricing');

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
