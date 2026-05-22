import React from 'react';
import {
    Card,
    BlockStack,
    InlineStack,
    Text,
    Button,
    Badge,
    Divider,
    Icon,
} from '@shopify/polaris';
import { CheckIcon, AlertCircleIcon } from '@shopify/polaris-icons';

const SETTINGS_ITEMS = [
    {
        key: 'submitButtonText',
        label: 'Submit button text',
        defaultVal: 'Submit',
        suggestion: 'Change the submit button text to "Send Message"',
        check: (v) => v && v !== 'Submit',
    },
    {
        key: 'successMessage',
        label: 'Success message',
        defaultVal: null,
        suggestion: 'Set a success message: "Thank you! We will get back to you shortly."',
        check: (v) => !!v,
    },
    {
        key: 'redirectUrl',
        label: 'Redirect URL after submit',
        defaultVal: null,
        suggestion: 'After form submission redirect the user to /pages/thank-you',
        check: (v) => !!v,
        optional: true,
    },
];

const STYLE_ITEMS = [
    {
        key: 'primaryColor',
        label: 'Primary color',
        defaultVal: '#5C6AC4',
        suggestion: 'Change the form primary color to #E85D04',
        check: (v) => !!v && v !== '#5C6AC4',
    },
    {
        key: 'borderRadius',
        label: 'Border radius',
        defaultVal: '8px',
        suggestion: 'Make the form fields have rounded corners with 12px border radius',
        check: (v) => !!v && v !== '8px',
    },
    {
        key: 'fontFamily',
        label: 'Font family',
        defaultVal: 'sans-serif',
        suggestion: 'Change the form font to serif',
        check: (v) => !!v && v !== 'sans-serif',
    },
];

function CompletionItem({ label, value, done, optional, suggestion, onSetViaPrompt }) {
    return (
        <InlineStack align="space-between" blockAlign="center" gap="400">
            <InlineStack gap="200" blockAlign="center">
                <Icon
                    source={done ? CheckIcon : AlertCircleIcon}
                    tone={done ? 'success' : optional ? 'subdued' : 'caution'}
                />
                <BlockStack gap="0">
                    <Text variant="bodySm" fontWeight={done ? 'regular' : 'semibold'}>
                        {label}
                    </Text>
                    {value && (
                        <Text variant="bodySm" tone="subdued" truncate>
                            {typeof value === 'string' && value.startsWith('#') ? (
                                <InlineStack gap="100" blockAlign="center">
                                    <span style={{
                                        display: 'inline-block',
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        backgroundColor: value,
                                        border: '1px solid #ccc',
                                        verticalAlign: 'middle',
                                    }} />
                                    {value}
                                </InlineStack>
                            ) : value}
                        </Text>
                    )}
                    {!done && !optional && (
                        <Text variant="bodySm" tone="caution">Not set</Text>
                    )}
                    {!done && optional && (
                        <Text variant="bodySm" tone="subdued">Optional — not set</Text>
                    )}
                </BlockStack>
            </InlineStack>
            {!done && (
                <Button size="slim" onClick={() => onSetViaPrompt(suggestion)}>
                    Set via prompt
                </Button>
            )}
        </InlineStack>
    );
}

export default function FormCompletion({ form, onSetViaPrompt }) {
    if (!form?.schema?.fields?.length) return null;

    const settings = form.settings || {};
    const styles = form.styles || {};

    const settingItems = SETTINGS_ITEMS.map((item) => ({
        ...item,
        done: item.check(settings[item.key]),
        value: settings[item.key] || null,
    }));

    const styleItems = STYLE_ITEMS.map((item) => ({
        ...item,
        done: item.check(styles[item.key]),
        value: styles[item.key] || null,
    }));

    const pendingRequired = settingItems.filter((i) => !i.done && !i.optional).length;
    const pendingStyles = styleItems.filter((i) => !i.done).length;
    const allDone = pendingRequired === 0;

    return (
        <Card>
            <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                    <Text variant="headingMd">Form completion</Text>
                    {allDone
                        ? <Badge tone="success">All set</Badge>
                        : <Badge tone="attention">{pendingRequired} remaining</Badge>
                    }
                </InlineStack>

                <Divider />

                <BlockStack gap="100">
                    <Text variant="bodySm" fontWeight="semibold" tone="subdued">SETTINGS</Text>
                    <BlockStack gap="300">
                        {settingItems.map((item) => (
                            <CompletionItem
                                key={item.key}
                                {...item}
                                onSetViaPrompt={onSetViaPrompt}
                            />
                        ))}
                    </BlockStack>
                </BlockStack>

                <Divider />

                <BlockStack gap="100">
                    <InlineStack align="space-between" blockAlign="center">
                        <Text variant="bodySm" fontWeight="semibold" tone="subdued">STYLING</Text>
                        <Text variant="bodySm" tone="subdued">prompt-only</Text>
                    </InlineStack>
                    <BlockStack gap="300">
                        {styleItems.map((item) => (
                            <CompletionItem
                                key={item.key}
                                {...item}
                                optional
                                onSetViaPrompt={onSetViaPrompt}
                            />
                        ))}
                    </BlockStack>
                </BlockStack>
            </BlockStack>
        </Card>
    );
}
