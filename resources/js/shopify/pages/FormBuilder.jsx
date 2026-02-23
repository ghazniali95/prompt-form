import React, { useState, useEffect, useRef } from 'react';
import {
    Page,
    Card,
    TextField,
    Button,
    Banner,
    Spinner,
    BlockStack,
    InlineStack,
    Text,
    Divider,
    Modal,
    Badge,
} from '@shopify/polaris';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import FormRenderer from '../components/FormRenderer';
import FormCompletion from '../components/FormCompletion';

export default function FormBuilder({ formId, onBack }) {
    const api = useAuthenticatedFetch();
    const promptRef = useRef(null);

    const [form, setForm] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(!!formId);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewSubmitted, setPreviewSubmitted] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    useEffect(() => {
        if (formId) fetchForm();
    }, [formId]);

    const fetchForm = async () => {
        try {
            const { data } = await api.get(`/api/shopify/forms/${formId}`);
            setForm(data.data);
        } catch {
            setError('Failed to load form.');
        } finally {
            setLoading(false);
        }
    };

    // Called by FormCompletion when user clicks "Set via prompt"
    const handleSetViaPrompt = (suggestion) => {
        setPrompt(suggestion);
        // Scroll to and focus the prompt field
        promptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setGenerating(true);
        setError(null);
        try {
            const isRefinement = !!form?.schema?.fields?.length;
            const endpoint = isRefinement ? '/api/shopify/ai/refine' : '/api/shopify/ai/generate';
            const payload = isRefinement
                ? { prompt, existing_schema: form, form_id: formId || null }
                : { prompt, form_id: formId || null };

            const { data } = await api.post(endpoint, payload);
            setForm((prev) => ({ ...(prev || {}), ...data.data }));
            setPrompt('');
            setSuccessMsg('Done! Review the changes and save when ready.');
        } catch {
            setError('AI generation failed. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!form) return;
        setSaving(true);
        setError(null);
        try {
            if (form.id) {
                const { data } = await api.put(`/api/shopify/forms/${form.id}`, form);
                setForm(data.data);
            } else {
                const { data } = await api.post('/api/shopify/forms', form);
                setForm(data.data);
            }
            setSuccessMsg('Form saved successfully.');
        } catch {
            setError('Failed to save form.');
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!form?.id) {
            setError('Save the form first before publishing.');
            return;
        }
        setPublishing(true);
        setError(null);
        try {
            const { data } = await api.post(`/api/shopify/forms/${form.id}/publish`);
            setForm(data.data);
            setSuccessMsg('Form published! It is now live on your storefront.');
        } catch {
            setError('Failed to publish form.');
        } finally {
            setPublishing(false);
        }
    };

    if (loading) {
        return (
            <Page title="Form Builder">
                <Card>
                    <InlineStack align="center"><Spinner /></InlineStack>
                </Card>
            </Page>
        );
    }

    const fieldCount = form?.schema?.fields?.length || 0;
    const stepCount = form?.steps?.length || 0;

    return (
        <Page
            title={form?.title || 'New Form'}
            backAction={{ content: 'Forms', onAction: onBack }}
            primaryAction={{
                content: 'Save',
                onAction: handleSave,
                loading: saving,
                disabled: !form,
            }}
            secondaryActions={[
                {
                    content: 'Preview',
                    onAction: () => { setPreviewSubmitted(false); setPreviewOpen(true); },
                    disabled: !fieldCount,
                },
                {
                    content: form?.is_published ? 'Published' : 'Publish',
                    onAction: handlePublish,
                    loading: publishing,
                    disabled: !form?.id || form?.is_published,
                },
            ]}
        >
            <BlockStack gap="500">
                {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}
                {successMsg && <Banner tone="success" onDismiss={() => setSuccessMsg(null)}>{successMsg}</Banner>}

                {/* AI Prompt */}
                <div ref={promptRef}>
                    <Card>
                        <BlockStack gap="400">
                            <BlockStack gap="100">
                                <Text variant="headingMd">
                                    {form?.schema ? 'Refine with AI' : 'Describe your form'}
                                </Text>
                                <Text tone="subdued">
                                    {form?.schema
                                        ? 'Describe what to change — add fields, update styling, set success message, change button text, etc.'
                                        : 'Describe the form you need. Include fields, steps, styling, and submit behaviour.'}
                                </Text>
                            </BlockStack>
                            <TextField
                                label="Prompt"
                                labelHidden
                                value={prompt}
                                onChange={setPrompt}
                                multiline={4}
                                placeholder={
                                    form?.schema
                                        ? 'e.g. Change the submit button to "Send Message" and show "Thanks, we\'ll reply within 24 hours" on success'
                                        : 'e.g. Create a contact form with name, email, and message. Use a purple theme. Show "Thanks!" after submit.'
                                }
                                autoComplete="off"
                            />
                            <InlineStack align="end">
                                <Button
                                    variant="primary"
                                    onClick={handleGenerate}
                                    loading={generating}
                                    disabled={!prompt.trim()}
                                >
                                    {form?.schema ? 'Refine with AI' : 'Generate form'}
                                </Button>
                            </InlineStack>
                        </BlockStack>
                    </Card>
                </div>

                {/* Form Completion checklist */}
                {fieldCount > 0 && (
                    <FormCompletion
                        form={form}
                        onSetViaPrompt={handleSetViaPrompt}
                    />
                )}

                {/* Form details */}
                {form && (
                    <Card>
                        <BlockStack gap="400">
                            <InlineStack align="space-between" blockAlign="center">
                                <Text variant="headingMd">Form details</Text>
                                {form.is_published && <Badge tone="success">Published</Badge>}
                            </InlineStack>
                            <Divider />

                            <TextField
                                label="Title"
                                value={form.title || ''}
                                onChange={(val) => setForm((f) => ({ ...f, title: val }))}
                                autoComplete="off"
                            />

                            <InlineStack gap="400">
                                <Text variant="bodySm" tone="subdued">
                                    {fieldCount} field{fieldCount !== 1 ? 's' : ''}
                                </Text>
                                {stepCount > 1 && (
                                    <Text variant="bodySm" tone="subdued">
                                        {stepCount} steps
                                    </Text>
                                )}
                            </InlineStack>

                            {fieldCount > 0 && (
                                <BlockStack gap="150">
                                    <Text variant="bodyMd" fontWeight="semibold">Fields</Text>
                                    {form.schema.fields.map((field) => (
                                        <InlineStack key={field.id} gap="300" blockAlign="center">
                                            <Badge>{field.type}</Badge>
                                            <Text variant="bodySm">{field.label}</Text>
                                            {field.required && (
                                                <Text variant="bodySm" tone="critical">required</Text>
                                            )}
                                        </InlineStack>
                                    ))}
                                </BlockStack>
                            )}

                            {form.id && (
                                <BlockStack gap="100">
                                    <Text variant="bodySm" tone="subdued">
                                        Form ID — used to embed this form in your storefront
                                    </Text>
                                    <Text variant="bodyMd" fontFamily="mono">{form.ulid}</Text>
                                </BlockStack>
                            )}
                        </BlockStack>
                    </Card>
                )}
            </BlockStack>

            {/* Preview Modal */}
            <Modal
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                title={form?.title || 'Form Preview'}
                size="small"
            >
                <Modal.Section>
                    <FormRenderer
                        schema={form?.schema}
                        styles={form?.styles}
                        steps={form?.steps}
                        settings={form?.settings}
                        submitted={previewSubmitted}
                        onSubmit={() => setPreviewSubmitted(true)}
                    />
                </Modal.Section>
            </Modal>
        </Page>
    );
}
