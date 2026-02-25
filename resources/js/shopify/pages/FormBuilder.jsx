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
    Badge,
    Modal,
    Box,
    List,
} from '@shopify/polaris';
import { ClipboardIcon } from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import FormCompletion from '../components/FormCompletion';
import FormPreview from '../components/FormPreview';

// Fields that count as "dirty" when changed
function formSnapshot(f) {
    if (!f) return null;
    return JSON.stringify({
        title:       f.title,
        schema:      f.schema,
        styles:      f.styles,
        steps:       f.steps,
        settings:    f.settings,
        display:     f.display,
        image:       f.image,
        cookies:     f.cookies,
        post_submit: f.post_submit,
    });
}

export default function FormBuilder({ formId, onBack, onNavigatePricing }) {
    const api       = useAuthenticatedFetch();
    const promptRef = useRef(null);
    const savedForm = useRef(null); // snapshot of last saved/fetched state

    const [form,        setForm]        = useState(null);
    const [prompt,      setPrompt]      = useState('');
    const [loading,     setLoading]     = useState(!!formId);
    const [generating,  setGenerating]  = useState(false);
    const [saving,      setSaving]      = useState(false);
    const [publishing,  setPublishing]  = useState(false);
    const [error,       setError]       = useState(null);
    const [upgradeError, setUpgradeError] = useState(null);
    const [successMsg,  setSuccessMsg]  = useState(null);
    const [exitModal,    setExitModal]    = useState(false);
    const [publishModal, setPublishModal] = useState(false);
    const [idCopied,     setIdCopied]     = useState(false);

    const isDirty = formSnapshot(form) !== formSnapshot(savedForm.current);

    useEffect(() => {
        if (formId) fetchForm();
    }, [formId]);

    const fetchForm = async () => {
        try {
            const { data } = await api.get(`/api/shopify/forms/${formId}`);
            setForm(data.data);
            savedForm.current = data.data;
        } catch {
            setError('Failed to load form.');
        } finally {
            setLoading(false);
        }
    };

    const handleSetViaPrompt = (suggestion) => {
        setPrompt(suggestion);
        promptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setGenerating(true);
        setError(null);
        try {
            const isRefinement = !!form?.schema?.fields?.length;
            const endpoint = isRefinement ? '/api/shopify/ai/refine' : '/api/shopify/ai/generate';
            const payload  = isRefinement
                ? { prompt, existing_schema: form, form_id: formId || null }
                : { prompt, form_id: formId || null };

            const { data } = await api.post(endpoint, payload);
            setForm((prev) => ({ ...(prev || {}), ...data.data }));
            setPrompt('');
            setSuccessMsg('Done! Review the changes and save when ready.');
        } catch (err) {
            const body = err.response?.data;
            if (body?.upgrade_required) {
                setUpgradeError(body.message);
            } else {
                setError('AI generation failed. Please try again.');
            }
        } finally {
            setGenerating(false);
        }
    };

    // Core save logic — returns true on success so callers can chain actions
    const saveForm = async () => {
        if (!form) return false;
        setSaving(true);
        setError(null);
        try {
            let saved;
            if (form.id) {
                const { data } = await api.put(`/api/shopify/forms/${form.id}`, form);
                saved = data.data;
            } else {
                const { data } = await api.post('/api/shopify/forms', form);
                saved = data.data;
            }
            setForm(saved);
            savedForm.current = saved;
            setSuccessMsg('Form saved successfully.');
            return true;
        } catch (err) {
            const body = err.response?.data;
            if (body?.upgrade_required) {
                setUpgradeError(body.message);
            } else {
                setError('Failed to save form.');
            }
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleSave = () => saveForm();

    const handleSaveAndExit = async () => {
        const ok = await saveForm();
        if (ok) onBack();
    };

    const handleBack = () => {
        if (isDirty) {
            setExitModal(true);
        } else {
            onBack();
        }
    };

    const copyFormId = () => {
        if (!form?.ulid) return;
        navigator.clipboard.writeText(form.ulid);
        setIdCopied(true);
        setTimeout(() => setIdCopied(false), 2000);
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
            savedForm.current = data.data;
            setPublishModal(true); // show instructions on every publish
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
    const stepCount  = form?.steps?.length || 0;

    return (
        <Page
            title={form?.title || 'New Form'}
            backAction={{ content: 'Forms', onAction: handleBack }}
            primaryAction={{
                content: 'Save',
                onAction: handleSave,
                loading: saving,
                disabled: !form,
            }}
            secondaryActions={[
                ...(form?.ulid ? [{
                    content: idCopied ? 'Copied!' : 'Copy Form ID',
                    icon: ClipboardIcon,
                    onAction: copyFormId,
                }] : []),
                {
                    content: form?.is_published ? 'Published' : 'Publish',
                    onAction: handlePublish,
                    loading: publishing,
                    disabled: !form?.id || form?.is_published,
                },
            ]}
        >
            <BlockStack gap="500">
                {error      && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}
                {successMsg && <Banner tone="success"  onDismiss={() => setSuccessMsg(null)}>{successMsg}</Banner>}
                {upgradeError && (
                    <Banner tone="critical" onDismiss={() => setUpgradeError(null)}>
                        <InlineStack gap="100" wrap={false}>
                            <span>{upgradeError}</span>
                            <Button variant="plain" onClick={onNavigatePricing}>Upgrade your plan →</Button>
                        </InlineStack>
                    </Banner>
                )}

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

                {/* Storefront Preview */}
                {fieldCount > 0 && (
                    <Card>
                        <BlockStack gap="400">
                            <BlockStack gap="100">
                                <Text variant="headingMd">Storefront Preview</Text>
                                <Text tone="subdued">This is exactly how your form will appear on your store.</Text>
                            </BlockStack>
                            <Divider />
                            <FormPreview form={form} />
                        </BlockStack>
                    </Card>
                )}

                {/* Form Completion checklist */}
                {fieldCount > 0 && (
                    <FormCompletion form={form} onSetViaPrompt={handleSetViaPrompt} />
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

            <div style={{ paddingBottom: 40 }} />

            {/* Unsaved changes modal */}
            <Modal
                open={exitModal}
                onClose={() => setExitModal(false)}
                title="You have unsaved changes"
                primaryAction={{
                    content: 'Save & exit',
                    onAction: handleSaveAndExit,
                    loading: saving,
                }}
                secondaryActions={[
                    {
                        content: 'Discard & exit',
                        onAction: onBack,
                        destructive: true,
                    },
                    {
                        content: 'Keep editing',
                        onAction: () => setExitModal(false),
                    },
                ]}
            >
                <Modal.Section>
                    <Text>
                        Your form has unsaved changes. Save before leaving so you don't lose your work.
                    </Text>
                </Modal.Section>
            </Modal>
            {/* Publish instructions modal */}
            {publishModal && (() => {
                const shop = new URLSearchParams(window.location.search).get('shop');
                const themeEditorUrl = shop
                    ? `https://${shop}/admin/themes/current/editor`
                    : null;
                return (
                    <Modal
                        open
                        onClose={() => setPublishModal(false)}
                        title="🎉 Your form is live!"
                        primaryAction={{ content: 'Done', onAction: () => setPublishModal(false) }}
                    >
                        <Modal.Section>
                            <BlockStack gap="400">
                                <Text>Your form is published and ready to embed on your storefront. Follow the steps below to add it to any page.</Text>

                                <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                                    <BlockStack gap="200">
                                        <Text variant="headingSm">Your Form ID</Text>
                                        <InlineStack gap="300" blockAlign="center">
                                            <Text variant="bodyMd" fontFamily="mono">{form?.ulid}</Text>
                                            <Button
                                                size="slim"
                                                icon={ClipboardIcon}
                                                onClick={copyFormId}
                                            >
                                                {idCopied ? 'Copied!' : 'Copy'}
                                            </Button>
                                        </InlineStack>
                                    </BlockStack>
                                </Box>

                                <BlockStack gap="200">
                                    <Text variant="headingSm">How to add this form to your store</Text>
                                    <List type="number">
                                        <List.Item>Open your <strong>Theme Editor</strong> using the button below</List.Item>
                                        <List.Item>Navigate to the page where you want the form to appear</List.Item>
                                        <List.Item>Click <strong>Add section</strong> or <strong>Add block</strong></List.Item>
                                        <List.Item>Under <strong>Apps</strong>, select <strong>Prompt Form</strong></List.Item>
                                        <List.Item>Paste your <strong>Form ID</strong> into the block settings</List.Item>
                                        <List.Item>Click <strong>Save</strong> in the theme editor</List.Item>
                                    </List>
                                </BlockStack>

                                {themeEditorUrl && (
                                    <Button
                                        url={themeEditorUrl}
                                        external
                                        variant="primary"
                                    >
                                        Open Theme Editor
                                    </Button>
                                )}

                                <Text variant="bodySm" tone="subdued">
                                    The API URL is configured automatically — you only need the Form ID.
                                </Text>
                            </BlockStack>
                        </Modal.Section>
                    </Modal>
                );
            })()}
        </Page>
    );
}
