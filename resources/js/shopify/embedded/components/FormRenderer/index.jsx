import React, { useState } from 'react';
import {
    BlockStack,
    Button,
    Text,
    ProgressBar,
    Banner,
    Card,
    InlineStack,
    Divider,
} from '@shopify/polaris';
import FormField from './FormField';

function validateField(field, value) {
    if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
        return `${field.label} is required.`;
    }
    const v = field.validations || {};
    if (value && v.minLength && value.length < v.minLength) {
        return `${field.label} must be at least ${v.minLength} characters.`;
    }
    if (value && v.maxLength && value.length > v.maxLength) {
        return `${field.label} must be at most ${v.maxLength} characters.`;
    }
    if (value && field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address.';
    }
    return null;
}

export default function FormRenderer({ schema, styles = {}, steps = [], settings = {}, onSubmit, submitting = false, submitted = false }) {
    const fields = schema?.fields || [];
    const resolvedSteps = steps?.length > 0 ? steps : [{ title: '', fields: fields.map((f) => f.id) }];
    const totalSteps = resolvedSteps.length;
    const isMultiStep = totalSteps > 1;

    const [currentStep, setCurrentStep] = useState(0);
    const [values, setValues] = useState({});
    const [errors, setErrors] = useState({});

    const primaryColor = styles?.primaryColor || '#5C6AC4';
    const borderRadius = styles?.borderRadius || '8px';
    const submitText = settings?.submitButtonText || 'Submit';
    const successMessage = settings?.successMessage || 'Thank you for your submission!';

    const currentStepData = resolvedSteps[currentStep];
    const currentFields = fields.filter((f) => currentStepData?.fields?.includes(f.id));

    const handleChange = (fieldId, value) => {
        setValues((prev) => ({ ...prev, [fieldId]: value }));
        if (errors[fieldId]) {
            setErrors((prev) => ({ ...prev, [fieldId]: null }));
        }
    };

    const validateStep = () => {
        const stepErrors = {};
        currentFields.forEach((field) => {
            const err = validateField(field, values[field.id]);
            if (err) stepErrors[field.id] = err;
        });
        setErrors((prev) => ({ ...prev, ...stepErrors }));
        return Object.keys(stepErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep()) setCurrentStep((s) => s + 1);
    };

    const handleBack = () => setCurrentStep((s) => s - 1);

    const handleSubmit = () => {
        if (!validateStep()) return;
        onSubmit?.(values);
    };

    if (submitted) {
        return (
            <Banner tone="success">
                <Text variant="bodyMd">{successMessage}</Text>
            </Banner>
        );
    }

    if (fields.length === 0) {
        return (
            <Banner tone="warning">
                <Text variant="bodyMd">This form has no fields yet.</Text>
            </Banner>
        );
    }

    return (
        <BlockStack gap="400">
            {isMultiStep && (
                <BlockStack gap="200">
                    <InlineStack align="space-between">
                        <Text variant="bodySm" tone="subdued">
                            Step {currentStep + 1} of {totalSteps}
                        </Text>
                        {currentStepData.title && (
                            <Text variant="bodyMd" fontWeight="semibold">{currentStepData.title}</Text>
                        )}
                    </InlineStack>
                    <ProgressBar progress={((currentStep + 1) / totalSteps) * 100} size="small" />
                </BlockStack>
            )}

            <BlockStack gap="300">
                {currentFields.map((field) => (
                    <FormField
                        key={field.id}
                        field={field}
                        value={values[field.id]}
                        onChange={handleChange}
                        error={errors[field.id]}
                    />
                ))}
            </BlockStack>

            {isMultiStep && <Divider />}

            <InlineStack align={isMultiStep ? 'space-between' : 'end'}>
                {isMultiStep && currentStep > 0 && (
                    <Button onClick={handleBack}>Back</Button>
                )}
                {isMultiStep && currentStep < totalSteps - 1 ? (
                    <Button
                        variant="primary"
                        onClick={handleNext}
                        style={{ backgroundColor: primaryColor, borderRadius }}
                    >
                        Next
                    </Button>
                ) : (
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        loading={submitting}
                        style={{ backgroundColor: primaryColor, borderRadius }}
                    >
                        {submitText}
                    </Button>
                )}
            </InlineStack>
        </BlockStack>
    );
}
