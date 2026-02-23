import React, { useState } from 'react';
import { Frame, Navigation } from '@shopify/polaris';
import { HomeIcon, NoteIcon } from '@shopify/polaris-icons';
import FormsIndex from './pages/FormsIndex';
import FormBuilder from './pages/FormBuilder';

export default function App() {
    const [currentPage, setCurrentPage] = useState('forms');
    const [editingFormId, setEditingFormId] = useState(null);

    const navigate = (page, formId = null) => {
        setCurrentPage(page);
        setEditingFormId(formId);
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'builder':
                return <FormBuilder formId={editingFormId} onBack={() => navigate('forms')} />;
            default:
                return <FormsIndex onCreateNew={() => navigate('builder')} onEdit={(id) => navigate('builder', id)} />;
        }
    };

    const nav = (
        <Navigation location="/">
            <Navigation.Section
                items={[
                    {
                        label: 'Forms',
                        icon: NoteIcon,
                        onClick: () => navigate('forms'),
                        selected: currentPage === 'forms',
                    },
                ]}
            />
        </Navigation>
    );

    return (
        <Frame navigation={nav}>
            {renderPage()}
        </Frame>
    );
}
