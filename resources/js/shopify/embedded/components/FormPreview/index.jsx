import React, { useState } from 'react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isFieldVisible(field, values) {
    if (!field.conditions || field.conditions.length === 0) return true;
    return field.conditions.some((cond) => {
        if (cond.action !== 'show') return false;
        const { fieldId, operator, value } = cond.when;
        const current = String(values[fieldId] || '');
        const target  = String(value || '');
        switch (operator) {
            case 'equals':        return current === target;
            case 'not_equals':    return current !== target;
            case 'contains':      return current.includes(target);
            case 'greater_than':  return Number(current) > Number(target);
            case 'less_than':     return Number(current) < Number(target);
            default:              return false;
        }
    });
}

function modeLabel(display) {
    if (!display || display.mode === 'inline') return null;
    const modeNames = {
        'popup':         'Popup',
        'slide-left':    'Slide from left',
        'slide-right':   'Slide from right',
        'slide-bottom':  'Slide from bottom',
    };
    const triggerNames = {
        'immediate':   'on page load',
        'delay':       `after ${display.delay || 3}s`,
        'scroll':      'on scroll',
        'exit-intent': 'on exit intent',
    };
    const name    = modeNames[display.mode]    || display.mode;
    const trigger = triggerNames[display.trigger] || display.trigger || 'on page load';
    return `${name} · ${trigger}`;
}

// ─── Primitive field components ───────────────────────────────────────────────

function Label({ label, required, labelColor }) {
    return (
        <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500, color: labelColor || '#374151' }}>
            {label}
            {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
        </label>
    );
}

function ErrorMsg({ error }) {
    if (!error) return null;
    return <p style={{ margin: '4px 0 0', fontSize: 12, color: '#ef4444' }}>{error}</p>;
}

function inputStyle(borderRadius, hasError, inputBorderColor, fontSize) {
    return {
        display: 'block', width: '100%', padding: '8px 12px',
        fontSize: fontSize || 14, lineHeight: '1.5', color: '#333',
        backgroundColor: '#fff',
        border: `1px solid ${hasError ? '#ef4444' : (inputBorderColor || '#d1d5db')}`,
        borderRadius, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
    };
}

// ─── Field renderer ───────────────────────────────────────────────────────────

function PreviewField({ field, value, onChange, error, borderRadius, labelColor, inputBorderColor, fontSize }) {
    if (field.type === 'hidden') return null;
    const style = inputStyle(borderRadius, !!error, inputBorderColor, fontSize);
    const set   = (val) => onChange(field.id, val);

    switch (field.type) {
        case 'text': case 'email': case 'tel': case 'number':
            return (
                <div>
                    <Label label={field.label} required={field.required} labelColor={labelColor} />
                    <input type={field.type} value={value || ''} onChange={(e) => set(e.target.value)}
                        placeholder={field.placeholder || ''} style={style} />
                    <ErrorMsg error={error} />
                </div>
            );
        case 'textarea':
            return (
                <div>
                    <Label label={field.label} required={field.required} labelColor={labelColor} />
                    <textarea value={value || ''} onChange={(e) => set(e.target.value)}
                        placeholder={field.placeholder || ''} rows={3}
                        style={{ ...style, resize: 'vertical' }} />
                    <ErrorMsg error={error} />
                </div>
            );
        case 'select':
            return (
                <div>
                    <Label label={field.label} required={field.required} labelColor={labelColor} />
                    <select value={value || ''} onChange={(e) => set(e.target.value)} style={style}>
                        <option value="">Select {field.label}</option>
                        {(field.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ErrorMsg error={error} />
                </div>
            );
        case 'radio':
            return (
                <div>
                    <Label label={field.label} required={field.required} labelColor={labelColor} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                        {(field.options || []).map((opt) => (
                            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                                <input type="radio" name={field.id} value={opt} checked={value === opt}
                                    onChange={() => set(opt)} style={{ margin: 0 }} />
                                {opt}
                            </label>
                        ))}
                    </div>
                    <ErrorMsg error={error} />
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
                                    <input type="checkbox" checked={checked} style={{ margin: 0 }}
                                        onChange={(e) => {
                                            const cur = value || [];
                                            set(e.target.checked ? [...cur, opt] : cur.filter((v) => v !== opt));
                                        }} />
                                    {opt}
                                </label>
                            );
                        })}
                    </div>
                    <ErrorMsg error={error} />
                </div>
            );
        case 'date':
            return (
                <div>
                    <Label label={field.label} required={field.required} labelColor={labelColor} />
                    <input type="date" value={value || ''} onChange={(e) => set(e.target.value)} style={style} />
                    <ErrorMsg error={error} />
                </div>
            );
        default: return null;
    }
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateField(field, value) {
    if (field.required && (!value || (Array.isArray(value) && value.length === 0)))
        return `${field.label} is required.`;
    const v = field.validations || {};
    if (value && v.minLength && value.length < v.minLength)
        return `${field.label} must be at least ${v.minLength} characters.`;
    if (value && v.maxLength && value.length > v.maxLength)
        return `${field.label} must be at most ${v.maxLength} characters.`;
    if (value && field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return 'Please enter a valid email address.';
    return null;
}

// ─── Form body ────────────────────────────────────────────────────────────────

function FormBody({ form, onClose }) {
    const { schema, styles = {}, steps = [], settings = {} } = form;
    const allFields    = schema?.fields || [];
    const resolvedSteps = steps?.length > 0
        ? steps
        : [{ title: '', fields: allFields.map((f) => f.id) }];
    const totalSteps   = resolvedSteps.length;
    const isMultiStep  = totalSteps > 1;

    const primaryColor    = styles?.primaryColor    || '#5C6AC4';
    const backgroundColor = styles?.backgroundColor || '#ffffff';
    const labelColor      = styles?.labelColor      || '#374151';
    const inputBorderColor= styles?.inputBorderColor|| '#d1d5db';
    const buttonTextColor = styles?.buttonTextColor || '#ffffff';
    const borderRadius    = styles?.borderRadius    || '8px';
    const fontFamily      = styles?.fontFamily      || 'sans-serif';
    const fontSize        = styles?.fontSize        || '14px';
    const submitText      = settings?.submitButtonText || 'Submit';

    const [currentStep, setCurrentStep] = useState(0);
    const [values,      setValues]      = useState({});
    const [errors,      setErrors]      = useState({});
    const [submitted,   setSubmitted]   = useState(false);

    const currentStepData = resolvedSteps[currentStep];
    const stepFieldIds    = currentStepData?.fields || [];
    const currentFields   = allFields
        .filter((f) => stepFieldIds.includes(f.id))
        .filter((f) => isFieldVisible(f, values));

    const handleChange = (fieldId, value) => {
        setValues((prev) => ({ ...prev, [fieldId]: value }));
        if (errors[fieldId]) setErrors((prev) => ({ ...prev, [fieldId]: null }));
    };

    const validateStep = () => {
        const errs = {};
        currentFields.forEach((f) => {
            const e = validateField(f, values[f.id]);
            if (e) errs[f.id] = e;
        });
        setErrors((prev) => ({ ...prev, ...errs }));
        return Object.keys(errs).length === 0;
    };

    const handleNext   = () => { if (validateStep()) setCurrentStep((s) => s + 1); };
    const handleBack   = () => setCurrentStep((s) => s - 1);
    const handleSubmit = () => { if (validateStep()) setSubmitted(true); };

    const btnBase = { borderRadius, padding: '10px 24px', fontSize, fontWeight: 500, cursor: 'pointer', lineHeight: '1.5', border: 'none' };

    if (submitted) {
        return (
            <div style={{ fontFamily, padding: '20px', backgroundColor }}>
                <div style={{ padding: '14px 18px', backgroundColor: '#d1fae5', borderRadius, color: '#065f46', fontSize, marginBottom: 12 }}>
                    {settings?.successMessage || 'Thank you for your submission!'}
                </div>
                <button onClick={() => { setSubmitted(false); setValues({}); setErrors({}); setCurrentStep(0); }}
                    style={{ background: 'none', border: 'none', color: primaryColor, cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 13 }}>
                    Reset preview
                </button>
            </div>
        );
    }

    return (
        <div style={{ fontFamily, fontSize, color: '#333', backgroundColor, padding: '20px' }}>
            {/* Multi-step progress */}
            {isMultiStep && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: '#6b7280' }}>
                        <span>Step {currentStep + 1} of {totalSteps}</span>
                        {currentStepData.title && <span style={{ fontWeight: 500 }}>{currentStepData.title}</span>}
                    </div>
                    <div style={{ height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${((currentStep + 1) / totalSteps) * 100}%`, backgroundColor: primaryColor, transition: 'width 0.3s ease' }} />
                    </div>
                </div>
            )}

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                {currentFields.map((field) => (
                    <PreviewField key={field.id} field={field} value={values[field.id]}
                        onChange={handleChange} error={errors[field.id]}
                        borderRadius={borderRadius} labelColor={labelColor}
                        inputBorderColor={inputBorderColor} fontSize={fontSize} />
                ))}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: isMultiStep ? 'space-between' : 'flex-end', gap: 8 }}>
                {isMultiStep && currentStep > 0 && (
                    <button onClick={handleBack} style={{ ...btnBase, backgroundColor: 'transparent', color: '#555', border: '1px solid #d1d5db' }}>Back</button>
                )}
                {isMultiStep && currentStep < totalSteps - 1
                    ? <button onClick={handleNext} style={{ ...btnBase, backgroundColor: primaryColor, color: buttonTextColor }}>Next</button>
                    : <button onClick={handleSubmit} style={{ ...btnBase, backgroundColor: primaryColor, color: buttonTextColor }}>{submitText}</button>
                }
            </div>
        </div>
    );
}

// ─── Image layout wrapper ─────────────────────────────────────────────────────

function WithImage({ image, children }) {
    if (!image?.url) return children;
    const { url, alt = '', position = 'left' } = image;

    const img = (
        <div style={{
            flexShrink: 0,
            ...(position === 'left' || position === 'right'
                ? { width: '40%', minHeight: 200 }
                : { height: 160, width: '100%' }),
            backgroundImage: `url(${url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }} role="img" aria-label={alt} />
    );

    if (position === 'top')    return <div style={{ display: 'flex', flexDirection: 'column' }}>{img}{children}</div>;
    if (position === 'bottom') return <div style={{ display: 'flex', flexDirection: 'column' }}>{children}{img}</div>;
    if (position === 'right')  return <div style={{ display: 'flex' }}>{children}{img}</div>;
    return                            <div style={{ display: 'flex' }}>{img}{children}</div>;
}

// ─── Fake page background ─────────────────────────────────────────────────────

function FakePageBackground() {
    const bar = (w, mt = 10) => (
        <div style={{ height: 10, backgroundColor: '#d1d5db', borderRadius: 3, width: w, marginTop: mt, opacity: 0.5 }} />
    );
    return (
        <div style={{ padding: '16px 20px', userSelect: 'none', pointerEvents: 'none' }}>
            <div style={{ height: 16, backgroundColor: '#9ca3af', borderRadius: 3, width: '45%', opacity: 0.5 }} />
            {bar('70%')} {bar('80%')} {bar('60%')} {bar('75%')}
            <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                <div style={{ height: 28, width: 80, backgroundColor: '#9ca3af', borderRadius: 4, opacity: 0.4 }} />
                <div style={{ height: 28, width: 60, backgroundColor: '#d1d5db', borderRadius: 4, opacity: 0.4 }} />
            </div>
        </div>
    );
}

// ─── Viewport simulation ──────────────────────────────────────────────────────

function PreviewViewport({ form }) {
    const display = form?.display || {};
    const mode    = display.mode || 'inline';
    const image   = form?.image;
    const styles  = form?.styles || {};
    const bgColor = styles?.backgroundColor || '#ffffff';

    const formContent = (
        <WithImage image={image}>
            <FormBody form={form} />
        </WithImage>
    );

    // ── Inline — no viewport simulation needed ────────────────────────────
    if (mode === 'inline') {
        return (
            <div style={{ maxWidth: 520, margin: '0 auto', borderRadius: 8, overflow: 'hidden', border: '1px solid #e4e5e7' }}>
                {formContent}
            </div>
        );
    }

    // ── Shared viewport container ─────────────────────────────────────────
    const viewport = { position: 'relative', height: 460, backgroundColor: '#f3f4f6', borderRadius: 10, overflow: 'hidden', border: '1px solid #e4e5e7' };
    const backdrop = { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)' };
    const card     = { backgroundColor: bgColor, overflow: 'hidden' };

    // ── Popup ─────────────────────────────────────────────────────────────
    if (mode === 'popup') {
        return (
            <div style={viewport}>
                <FakePageBackground />
                <div style={backdrop} />
                <div style={{
                    ...card,
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '75%', maxWidth: 380,
                    maxHeight: '88%', overflowY: 'auto',
                    borderRadius: 12,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
                }}>
                    {formContent}
                </div>
            </div>
        );
    }

    // ── Slide from right ──────────────────────────────────────────────────
    if (mode === 'slide-right') {
        return (
            <div style={viewport}>
                <FakePageBackground />
                <div style={backdrop} />
                <div style={{
                    ...card,
                    position: 'absolute',
                    top: 0, right: 0, bottom: 0,
                    width: '58%', overflowY: 'auto',
                    boxShadow: '-6px 0 30px rgba(0,0,0,0.2)',
                }}>
                    {formContent}
                </div>
            </div>
        );
    }

    // ── Slide from left ───────────────────────────────────────────────────
    if (mode === 'slide-left') {
        return (
            <div style={viewport}>
                <FakePageBackground />
                <div style={backdrop} />
                <div style={{
                    ...card,
                    position: 'absolute',
                    top: 0, left: 0, bottom: 0,
                    width: '58%', overflowY: 'auto',
                    boxShadow: '6px 0 30px rgba(0,0,0,0.2)',
                }}>
                    {formContent}
                </div>
            </div>
        );
    }

    // ── Slide from bottom ─────────────────────────────────────────────────
    if (mode === 'slide-bottom') {
        return (
            <div style={viewport}>
                <FakePageBackground />
                <div style={backdrop} />
                <div style={{
                    ...card,
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    maxHeight: '72%', overflowY: 'auto',
                    borderRadius: '12px 12px 0 0',
                    boxShadow: '0 -6px 30px rgba(0,0,0,0.2)',
                }}>
                    {formContent}
                </div>
            </div>
        );
    }

    // Fallback
    return <div style={{ maxWidth: 520, margin: '0 auto' }}>{formContent}</div>;
}

// ─── Public export ────────────────────────────────────────────────────────────

export default function FormPreview({ form }) {
    const fieldCount = form?.schema?.fields?.filter((f) => f.type !== 'hidden').length || 0;

    if (!fieldCount) {
        return (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
                Generate a form above to see the preview.
            </div>
        );
    }

    const label = modeLabel(form?.display);

    return (
        <div>
            {label && (
                <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                        display: 'inline-block', fontSize: 12, fontWeight: 500,
                        backgroundColor: '#f0f0ff', color: '#5C6AC4',
                        border: '1px solid #c7d2fe', borderRadius: 20,
                        padding: '2px 10px',
                    }}>
                        {label}
                    </span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>Simulated storefront view</span>
                </div>
            )}
            <PreviewViewport form={form} />
        </div>
    );
}
