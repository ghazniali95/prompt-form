import React, { useEffect, useState } from 'react';
import {
    Page,
    Card,
    ResourceList,
    ResourceItem,
    Text,
    Badge,
    Button,
    EmptyState,
    Spinner,
    Banner,
    InlineStack,
    BlockStack,
    Modal,
} from '@shopify/polaris';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import FormRenderer from '../components/FormRenderer';

export default function FormsIndex({ onCreateNew, onEdit }) {
    const api = useAuthenticatedFetch();
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [previewForm, setPreviewForm] = useState(null);
    const [previewSubmitted, setPreviewSubmitted] = useState(false);

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        try {
            const { data } = await api.get('/api/shopify/forms');
            setForms(data.data);
        } catch (err) {
            setError('Failed to load forms.');
            console.error('Forms fetch error:', err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

    const openPreview = (form) => {
        setPreviewSubmitted(false);
        setPreviewForm(form);
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

    return (
        <Page
            title="Forms"
            primaryAction={{ content: 'Create form', onAction: onCreateNew }}
        >
            <BlockStack gap="400">
                {error && <Banner tone="critical">{error}</Banner>}

                {forms.length === 0 ? (
                    <Card>
                        <EmptyState
                            heading="Create your first form"
                            action={{ content: 'Create form', onAction: onCreateNew }}
                            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                        >
                            <p>Use AI prompts to build interactive forms for your store.</p>
                        </EmptyState>
                    </Card>
                ) : (
                    <Card padding="0">
                        <ResourceList
                            resourceName={{ singular: 'form', plural: 'forms' }}
                            items={forms}
                            renderItem={(form) => (
                                <ResourceItem
                                    id={String(form.id)}
                                    onClick={() => onEdit(form.id)}
                                    accessibilityLabel={`Edit ${form.title}`}
                                    shortcutActions={[
                                        {
                                            content: 'Preview',
                                            onAction: (e) => {
                                                e?.stopPropagation?.();
                                                openPreview(form);
                                            },
                                        },
                                    ]}
                                >
                                    <InlineStack align="space-between" blockAlign="center">
                                        <BlockStack gap="100">
                                            <Text variant="bodyMd" fontWeight="bold">{form.title}</Text>
                                            {form.ulid && (
                                                <Text variant="bodySm" tone="subdued">{form.ulid}</Text>
                                            )}
                                        </BlockStack>
                                        <Badge tone={form.is_published ? 'success' : 'attention'}>
                                            {form.is_published ? 'Published' : 'Draft'}
                                        </Badge>
                                    </InlineStack>
                                </ResourceItem>
                            )}
                        />
                    </Card>
                )}
            </BlockStack>

            {/* Preview Modal */}
            <Modal
                open={!!previewForm}
                onClose={() => setPreviewForm(null)}
                title={previewForm?.title || 'Form Preview'}
                size="small"
            >
                <Modal.Section>
                    {previewForm && (
                        <FormRenderer
                            schema={previewForm.schema}
                            styles={previewForm.styles}
                            steps={previewForm.steps}
                            settings={previewForm.settings}
                            submitted={previewSubmitted}
                            onSubmit={() => setPreviewSubmitted(true)}
                        />
                    )}
                </Modal.Section>
            </Modal>
        </Page>
    );
}
