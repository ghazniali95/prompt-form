import React, { useState } from 'react';
import { Frame } from '@shopify/polaris';
import FormsIndex from './pages/FormsIndex';
import FormBuilder from './pages/FormBuilder';
import PricingPage from './pages/PricingPage';

function getInitialTab() {
    return window.location.pathname === '/pricing' ? 'pricing' : 'forms';
}

export default function App() {
    const [currentPage, setCurrentPage] = useState('forms');
    const [editingFormId, setEditingFormId] = useState(null);
    const [navTab] = useState(getInitialTab);

    const navigate = (page, formId = null) => {
        setCurrentPage(page);
        setEditingFormId(formId);
    };

    const navigateToPricing = () => {
        window.location.href = '/pricing';
    };

    const renderPage = () => {
        if (currentPage === 'builder') {
            return <FormBuilder formId={editingFormId} onBack={() => navigate('forms')} onNavigatePricing={navigateToPricing} />;
        }
        if (navTab === 'pricing') {
            return <PricingPage />;
        }
        return <FormsIndex onCreateNew={() => navigate('builder')} onEdit={(id) => navigate('builder', id)} onNavigatePricing={navigateToPricing} />;
    };

    return (
        <Frame>
            {renderPage()}
        </Frame>
    );
}
