import React from 'react';
import {
    TextField,
    Select,
    Checkbox,
    BlockStack,
    Text,
    InlineStack,
} from '@shopify/polaris';

export default function FormField({ field, value, onChange, error }) {
    const handleChange = (val) => onChange(field.id, val);

    switch (field.type) {
        case 'text':
        case 'email':
        case 'tel':
        case 'number':
            return (
                <TextField
                    label={field.label}
                    type={field.type}
                    value={value || ''}
                    onChange={handleChange}
                    placeholder={field.placeholder || ''}
                    requiredIndicator={field.required}
                    error={error}
                    autoComplete="off"
                />
            );

        case 'textarea':
            return (
                <TextField
                    label={field.label}
                    value={value || ''}
                    onChange={handleChange}
                    placeholder={field.placeholder || ''}
                    multiline={4}
                    requiredIndicator={field.required}
                    error={error}
                    autoComplete="off"
                />
            );

        case 'select':
            return (
                <Select
                    label={field.label}
                    options={[
                        { label: `Select ${field.label}`, value: '' },
                        ...(field.options || []).map((opt) => ({
                            label: opt,
                            value: opt,
                        })),
                    ]}
                    value={value || ''}
                    onChange={handleChange}
                    requiredIndicator={field.required}
                    error={error}
                />
            );

        case 'radio':
            return (
                <BlockStack gap="200">
                    <Text variant="bodyMd">
                        {field.label}
                        {field.required && <Text as="span" tone="critical"> *</Text>}
                    </Text>
                    {(field.options || []).map((opt) => (
                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input
                                type="radio"
                                name={field.id}
                                value={opt}
                                checked={value === opt}
                                onChange={() => handleChange(opt)}
                            />
                            <Text variant="bodyMd">{opt}</Text>
                        </label>
                    ))}
                    {error && <Text tone="critical" variant="bodySm">{error}</Text>}
                </BlockStack>
            );

        case 'checkbox':
            return (
                <BlockStack gap="200">
                    <Text variant="bodyMd">
                        {field.label}
                        {field.required && <Text as="span" tone="critical"> *</Text>}
                    </Text>
                    {(field.options || []).map((opt) => (
                        <Checkbox
                            key={opt}
                            label={opt}
                            checked={(value || []).includes(opt)}
                            onChange={(checked) => {
                                const current = value || [];
                                const next = checked
                                    ? [...current, opt]
                                    : current.filter((v) => v !== opt);
                                handleChange(next);
                            }}
                        />
                    ))}
                    {error && <Text tone="critical" variant="bodySm">{error}</Text>}
                </BlockStack>
            );

        case 'date':
            return (
                <TextField
                    label={field.label}
                    type="date"
                    value={value || ''}
                    onChange={handleChange}
                    requiredIndicator={field.required}
                    error={error}
                    autoComplete="off"
                />
            );

        default:
            return null;
    }
}
