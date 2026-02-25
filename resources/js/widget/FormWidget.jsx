import React, { useState, useEffect } from 'react';

// ─── Shared primitive components ────────────────────────────────────────────

function Label({ label, required, labelColor }) {
    return (
        <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500, color: labelColor || '#374151' }}>
            {label}
            {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
        </label>
    );
}

function ErrorText({ error }) {
    if (!error) return null;
    return <p style={{ margin: '4px 0 0', fontSize: 12, color: '#ef4444' }}>{error}</p>;
}

function inputStyle(borderRadius, hasError, inputBorderColor, fontSize) {
    return {
        display: 'block',
        width: '100%',
        padding: '8px 12px',
        fontSize: fontSize || 14,
        lineHeight: '1.5',
        color: '#333',
        backgroundColor: '#fff',
        border: `1px solid ${hasError ? '#ef4444' : (inputBorderColor || '#d1d5db')}`,
        borderRadius,
        boxSizing: 'border-box',
        outline: 'none',
        fontFamily: 'inherit',
    };
}

// ─── Field renderer ──────────────────────────────────────────────────────────

function WidgetField({ field, value, onChange, error, borderRadius, labelColor, inputBorderColor, fontSize }) {
    const style = inputStyle(borderRadius, !!error, inputBorderColor, fontSize);
    const set = (val) => onChange(field.id, val);

    switch (field.type) {
        case 'text':
        case 'email':
        case 'tel':
        case 'number':
            return (
                <div>
                    <Label label={field.label} required={field.required} labelColor={labelColor} />
                    <input
                        type={field.type}
                        value={value || ''}
                        onChange={(e) => set(e.target.value)}
                        placeholder={field.placeholder || ''}
                        style={style}
                    />
                    <ErrorText error={error} />
                </div>
            );

        case 'textarea':
            return (
                <div>
                    <Label label={field.label} required={field.required} labelColor={labelColor} />
                    <textarea
                        value={value || ''}
                        onChange={(e) => set(e.target.value)}
                        placeholder={field.placeholder || ''}
                        rows={4}
                        style={{ ...style, resize: 'vertical' }}
                    />
                    <ErrorText error={error} />
                </div>
            );

        case 'select':
            return (
                <div>
                    <Label label={field.label} required={field.required} labelColor={labelColor} />
                    <select value={value || ''} onChange={(e) => set(e.target.value)} style={style}>
                        <option value="">Select {field.label}</option>
                        {(field.options || []).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                    <ErrorText error={error} />
                </div>
            );

        case 'radio':
            return (
                <div>
                    <Label label={field.label} required={field.required} labelColor={labelColor} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                        {(field.options || []).map((opt) => (
                            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                                <input
                                    type="radio"
                                    name={field.id}
                                    value={opt}
                                    checked={value === opt}
                                    onChange={() => set(opt)}
                                    style={{ margin: 0, flexShrink: 0 }}
                                />
                                {opt}
                            </label>
                        ))}
                    </div>
                    <ErrorText error={error} />
                </div>
            );

        case 'checkbox':
            return (
                <div>
                    <Label label={field.label} required={field.required} labelColor={labelColor} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                        {(field.options || []).map((opt) => {
                            const checked = (value || []).includes(opt);
                            return (
                                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => {
                                            const current = value || [];
                                            set(e.target.checked
                                                ? [...current, opt]
                                                : current.filter((v) => v !== opt));
                                        }}
                                        style={{ margin: 0, flexShrink: 0 }}
                                    />
                                    {opt}
                                </label>
                            );
                        })}
                    </div>
                    <ErrorText error={error} />
                </div>
            );

        case 'date':
            return (
                <div>
                    <Label label={field.label} required={field.required} labelColor={labelColor} />
                    <input
                        type="date"
                        value={value || ''}
                        onChange={(e) => set(e.target.value)}
                        style={style}
                    />
                    <ErrorText error={error} />
                </div>
            );

        default:
            return null;
    }
}

// ─── Validation ──────────────────────────────────────────────────────────────

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

// ─── Form renderer ───────────────────────────────────────────────────────────

function WidgetForm({ form, apiUrl, ulid }) {
    const { schema, styles = {}, steps = [], settings = {} } = form;
    const fields = schema?.fields || [];
    const resolvedSteps = steps?.length > 0
        ? steps
        : [{ title: '', fields: fields.map((f) => f.id) }];
    const totalSteps = resolvedSteps.length;
    const isMultiStep = totalSteps > 1;

    const primaryColor = styles?.primaryColor || '#5C6AC4';
    const backgroundColor = styles?.backgroundColor || '#ffffff';
    const labelColor = styles?.labelColor || '#374151';
    const inputBorderColor = styles?.inputBorderColor || '#d1d5db';
    const buttonTextColor = styles?.buttonTextColor || '#ffffff';
    const borderRadius = styles?.borderRadius || '8px';
    const fontFamily = styles?.fontFamily || 'sans-serif';
    const fontSize = styles?.fontSize || '14px';
    const submitText = settings?.submitButtonText || 'Submit';
    const successMessage = settings?.successMessage || 'Thank you for your submission!';
    const redirectUrl = settings?.redirectUrl || null;

    const [currentStep, setCurrentStep] = useState(0);
    const [values, setValues] = useState({});
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const currentStepData = resolvedSteps[currentStep];
    const currentFields = fields.filter((f) => currentStepData?.fields?.includes(f.id));

    const handleChange = (fieldId, value) => {
        setValues((prev) => ({ ...prev, [fieldId]: value }));
        if (errors[fieldId]) setErrors((prev) => ({ ...prev, [fieldId]: null }));
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

    const handleNext = () => { if (validateStep()) setCurrentStep((s) => s + 1); };
    const handleBack = () => setCurrentStep((s) => s - 1);

    const handleSubmit = async () => {
        if (!validateStep()) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            const res = await fetch(`${apiUrl}/forms/${ulid}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                },
                body: JSON.stringify({ data: values }),
            });
            if (!res.ok) throw new Error('Submission failed');
            setSubmitted(true);
            if (redirectUrl) {
                setTimeout(() => { window.location.href = redirectUrl; }, 1500);
            }
        } catch {
            setSubmitError('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const btnBase = { borderRadius, padding: '10px 24px', fontSize, fontWeight: 500, cursor: 'pointer', lineHeight: '1.5', border: 'none' };

    if (submitted) {
        return (
            <div style={{ fontFamily, padding: '14px 18px', backgroundColor: '#d1fae5', borderRadius, color: '#065f46', fontSize }}>
                {successMessage}
            </div>
        );
    }

    return (
        <div style={{ fontFamily, fontSize, color: '#333', backgroundColor, padding: '20px', borderRadius }}>
            {/* Multi-step progress */}
            {isMultiStep && (
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: '#6b7280' }}>
                        <span>Step {currentStep + 1} of {totalSteps}</span>
                        {currentStepData.title && <span style={{ fontWeight: 500, color: '#374151' }}>{currentStepData.title}</span>}
                    </div>
                    <div style={{ height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${((currentStep + 1) / totalSteps) * 100}%`,
                            backgroundColor: primaryColor,
                            transition: 'width 0.3s ease',
                        }} />
                    </div>
                </div>
            )}

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                {currentFields.map((field) => (
                    <WidgetField
                        key={field.id}
                        field={field}
                        value={values[field.id]}
                        onChange={handleChange}
                        error={errors[field.id]}
                        borderRadius={borderRadius}
                        labelColor={labelColor}
                        inputBorderColor={inputBorderColor}
                        fontSize={fontSize}
                    />
                ))}
            </div>

            {/* Submit error */}
            {submitError && (
                <div style={{ marginBottom: 14, padding: '10px 14px', backgroundColor: '#fee2e2', borderRadius, color: '#991b1b', fontSize: 13 }}>
                    {submitError}
                </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: isMultiStep ? 'space-between' : 'flex-end', gap: 8 }}>
                {isMultiStep && currentStep > 0 && (
                    <button onClick={handleBack} style={{ ...btnBase, backgroundColor: 'transparent', color: '#555', border: '1px solid #d1d5db' }}>
                        Back
                    </button>
                )}
                {isMultiStep && currentStep < totalSteps - 1 ? (
                    <button onClick={handleNext} style={{ ...btnBase, backgroundColor: primaryColor, color: buttonTextColor }}>
                        Next
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{ ...btnBase, backgroundColor: primaryColor, color: buttonTextColor, opacity: submitting ? 0.7 : 1 }}
                    >
                        {submitting ? 'Submitting…' : submitText}
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Root widget — fetches form data ─────────────────────────────────────────

export default function FormWidget({ ulid, apiUrl }) {
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`${apiUrl}/forms/${ulid}`, {
            headers: { Accept: 'application/json', 'ngrok-skip-browser-warning': 'true' },
        })
            .then((res) => {
                if (res.status === 404) throw new Error('not_found');
                if (!res.ok) throw new Error('server_error');
                return res.json();
            })
            .then((json) => setForm(json.data))
            .catch((err) => {
                if (err.message === 'not_found') {
                    setError('This form is not available or has not been published yet.');
                } else {
                    setError('Unable to load form. Please check your connection and try again.');
                }
            })
            .finally(() => setLoading(false));
    }, [ulid, apiUrl]);

    if (loading) return <div style={{ padding: 16, color: '#6b7280', fontSize: 14 }}>Loading…</div>;
    if (error) return <div style={{ padding: 16, color: '#991b1b', fontSize: 14 }}>{error}</div>;
    if (!form) return null;

    return <WidgetForm form={form} apiUrl={apiUrl} ulid={ulid} />;
}
