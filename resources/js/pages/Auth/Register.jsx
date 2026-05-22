import React, { useState } from 'react';
import { Input, Button, Typography, Alert } from 'antd';
import { Link, router } from '@inertiajs/react';
import axios from 'axios';

const { Title, Text } = Typography;

/* ─── Shared form card primitives (same as Login) ─── */
function FieldCard({ children, style = {} }) {
    return (
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: '16px 18px', ...style }}>
            {children}
        </div>
    );
}
function MockLabel({ text }) {
    return <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#555', marginBottom: 8 }}>{text}</div>;
}
function MockInput({ placeholder, focused }) {
    return (
        <div style={{
            height: 36, borderRadius: 7, border: `1px solid ${focused ? '#f97316' : '#2a2a2a'}`,
            background: '#0a0a0a', display: 'flex', alignItems: 'center', padding: '0 12px',
            boxShadow: focused ? '0 0 0 2px rgba(249,115,22,0.15)' : 'none',
        }}>
            <span style={{ fontSize: 12, color: '#444' }}>{placeholder}</span>
        </div>
    );
}
function MockButton({ label = 'Submit' }) {
    return (
        <div style={{ height: 36, borderRadius: 7, background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff' }}>{label}</span>
        </div>
    );
}

const CARDS = [
    <FieldCard key="c1">
        <div style={{ fontSize: 10, fontWeight: 700, color: '#f97316', marginBottom: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Product Feedback</div>
        <MockLabel text="How satisfied are you?" />
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[1,2,3,4,5].map(i => <div key={i} style={{ fontSize: 20, color: i <= 4 ? '#f97316' : '#2a2a2a' }}>★</div>)}
        </div>
        <MockLabel text="Comments" />
        <div style={{ height: 48, borderRadius: 7, border: '1px solid #2a2a2a', background: '#0a0a0a', padding: '8px 12px' }}>
            <span style={{ fontSize: 12, color: '#444' }}>Great product, love the AI features...</span>
        </div>
    </FieldCard>,
    <FieldCard key="c2">
        <MockLabel text="Select Plan" />
        {['Free', 'Starter — $19/mo', 'Pro — $49/mo'].map((opt, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '8px 10px', borderRadius: 7, border: `1px solid ${i === 1 ? '#f97316' : '#1a1a1a'}`, background: i === 1 ? 'rgba(249,115,22,0.06)' : 'transparent' }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${i === 1 ? '#f97316' : '#2a2a2a'}`, background: i === 1 ? '#f97316' : 'transparent', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: i === 1 ? '#f97316' : '#666' }}>{opt}</span>
            </div>
        ))}
    </FieldCard>,
    <FieldCard key="c3">
        <MockLabel text="Appointment Booking" />
        <MockInput placeholder="Your name" focused />
        <div style={{ marginTop: 10 }}>
            <MockLabel text="Preferred Date" />
            <div style={{ height: 36, borderRadius: 7, border: '1px solid #2a2a2a', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}>
                <span style={{ fontSize: 12, color: '#555' }}>May 20, 2026</span>
                <span style={{ color: '#f97316' }}>📅</span>
            </div>
        </div>
        <div style={{ marginTop: 10 }}><MockButton label="Book Now" /></div>
    </FieldCard>,
    <FieldCard key="c4">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#f97316', letterSpacing: '0.15em', textTransform: 'uppercase' }}>AI Generating Form</span>
        </div>
        {[100, 85, 70, 45].map((w, i) => (
            <div key={i} style={{ height: 10, background: '#1a1a1a', borderRadius: 4, marginBottom: 8, width: `${w}%` }} />
        ))}
        <div style={{ height: 28, borderRadius: 6, background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)', marginTop: 8 }} />
    </FieldCard>,
    <FieldCard key="c5">
        <MockLabel text="Job Application" />
        <MockInput placeholder="Full name" />
        <div style={{ marginTop: 10 }}><MockLabel text="Position" />
            <div style={{ height: 36, borderRadius: 7, border: '1px solid #2a2a2a', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}>
                <span style={{ fontSize: 12, color: '#888' }}>Frontend Engineer</span>
                <span style={{ fontSize: 10, color: '#444' }}>▾</span>
            </div>
        </div>
        <div style={{ marginTop: 10 }}><MockButton label="Apply" /></div>
    </FieldCard>,
    <FieldCard key="c6">
        <MockLabel text="Preferences" />
        {['Dark mode', 'Email digest', 'Push notifications'].map((opt, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#888' }}>{opt}</span>
                <div style={{ width: 34, height: 18, borderRadius: 999, background: i !== 2 ? '#f97316' : '#222', position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: i !== 2 ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff' }} />
                </div>
            </div>
        ))}
    </FieldCard>,
    <FieldCard key="c7">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(249,115,22,0.12)', border: '1.5px solid rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✓</div>
            <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Form Submitted!</div>
                <div style={{ fontSize: 10, color: '#555' }}>Response recorded</div>
            </div>
        </div>
        <div style={{ height: 2, background: '#1a1a1a', borderRadius: 999 }}>
            <div style={{ width: '100%', height: '100%', background: '#f97316', borderRadius: 999 }} />
        </div>
    </FieldCard>,
    <FieldCard key="c8">
        <MockLabel text="Upload Document" />
        <div style={{ height: 72, borderRadius: 7, border: '1.5px dashed #2a2a2a', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <div style={{ fontSize: 18, color: '#333' }}>⬆</div>
            <span style={{ fontSize: 10, color: '#444' }}>PDF, DOC up to 10MB</span>
        </div>
    </FieldCard>,
    <FieldCard key="c9">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            {[1,2,3].map((s, i) => (
                <React.Fragment key={s}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: s < 3 ? '#f97316' : '#1a1a1a', border: s === 3 ? '2px solid #2a2a2a' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: s < 3 ? '#fff' : '#444' }}>{s}</div>
                    {i < 2 && <div style={{ flex: 1, height: 2, margin: '0 4px', background: s < 2 ? '#f97316' : '#1a1a1a' }} />}
                </React.Fragment>
            ))}
        </div>
        <MockLabel text="Budget" />
        <div style={{ position: 'relative', height: 4, background: '#1a1a1a', borderRadius: 999, margin: '12px 0' }}>
            <div style={{ position: 'absolute', left: 0, width: '55%', height: '100%', background: '#f97316', borderRadius: 999 }} />
            <div style={{ position: 'absolute', left: '55%', top: '50%', transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', background: '#f97316', border: '2px solid #060606' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: '#555' }}>$0</span>
            <span style={{ fontSize: 10, color: '#f97316', fontWeight: 700 }}>$5,500</span>
            <span style={{ fontSize: 10, color: '#555' }}>$10k</span>
        </div>
    </FieldCard>,
    <FieldCard key="c10">
        <MockLabel text="Newsletter" />
        <MockInput placeholder="your@email.com" focused />
        <div style={{ marginTop: 10 }}><MockButton label="Subscribe" /></div>
        <div style={{ marginTop: 10, fontSize: 10, color: '#444', textAlign: 'center' }}>No spam. Unsubscribe anytime.</div>
    </FieldCard>,
    <FieldCard key="c11">
        <MockLabel text="Team Members" />
        {['Design', 'Engineering', 'Marketing'].map((dept, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${i < 2 ? '#f97316' : '#2a2a2a'}`, background: i < 2 ? '#f97316' : 'transparent', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: i < 2 ? '#ccc' : '#555' }}>{dept}</span>
            </div>
        ))}
    </FieldCard>,
    <FieldCard key="c12">
        <MockLabel text="Contact Support" />
        <MockInput placeholder="Describe your issue..." />
        <div style={{ marginTop: 10 }}>
            <MockLabel text="Priority" />
            {['Low', 'Medium', 'High'].map((p, i) => (
                <span key={i} style={{ display: 'inline-block', marginRight: 6, fontSize: 10, padding: '2px 8px', borderRadius: 999, background: i === 1 ? 'rgba(249,115,22,0.15)' : '#1a1a1a', color: i === 1 ? '#f97316' : '#555', border: i === 1 ? '1px solid rgba(249,115,22,0.3)' : '1px solid #222' }}>
                    {p}
                </span>
            ))}
        </div>
        <div style={{ marginTop: 10 }}><MockButton label="Submit Ticket" /></div>
    </FieldCard>,
];

const col1 = CARDS.filter((_, i) => i % 3 === 0);
const col2 = CARDS.filter((_, i) => i % 3 === 1);
const col3 = CARDS.filter((_, i) => i % 3 === 2);

export default function Register() {
    const [fields, setFields]   = useState({ name: '', email: '', password: '', password_confirmation: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    const set = (key) => (e) => setFields(f => ({ ...f, [key]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setFieldErrors({});
        try {
            const { data } = await axios.post('/auth/register', fields);
            router.visit(data.redirect);
        } catch (err) {
            if (err.response?.status === 422) {
                setFieldErrors(err.response.data.errors ?? {});
            } else {
                setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                html, body, #app { height: 100% !important; overflow: hidden !important; background: #fff !important; }
                @keyframes scrollUp { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
                .pf-col-1 { animation: scrollUp 40s linear infinite; }
                .pf-col-2 { animation: scrollUp 50s linear infinite; }
                .pf-col-3 { animation: scrollUp 62s linear infinite; }
            `}</style>

            <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden' }}>

                {/* ── LEFT PANEL ── */}
                <div style={{ width: '45%', minWidth: 420, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 64px', overflowY: 'auto' }}>

                    <Link href="/">
                        <img src="/images/logo.png" alt="PromptForm" style={{ height: 36 }} />
                    </Link>

                    <div style={{ maxWidth: 400, width: '100%', margin: '0 auto', padding: '32px 0' }}>

                        <div style={{ marginBottom: 36 }}>
                            <Title style={{ fontFamily: "'Manrope', sans-serif", fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 10px', lineHeight: 1.1 }}>
                                Create Account
                            </Title>
                            <Text type="secondary" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                                Build AI-powered forms in minutes.
                            </Text>
                        </div>

                        {error && <Alert message={error} type="error" style={{ marginBottom: 24 }} />}

                        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                            <div>
                                <Text type="secondary" style={{ display: 'block', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 8 }}>Full Name</Text>
                                <Input value={fields.name} onChange={set('name')} placeholder="Your full name" autoComplete="name" autoFocus size="large" status={fieldErrors.name ? 'error' : ''} />
                                {fieldErrors.name && <Text type="danger" style={{ fontSize: 12 }}>{fieldErrors.name[0]}</Text>}
                            </div>

                            <div>
                                <Text type="secondary" style={{ display: 'block', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 8 }}>Email Address</Text>
                                <Input type="email" value={fields.email} onChange={set('email')} placeholder="name@company.com" autoComplete="username" size="large" status={fieldErrors.email ? 'error' : ''} />
                                {fieldErrors.email && <Text type="danger" style={{ fontSize: 12 }}>{fieldErrors.email[0]}</Text>}
                            </div>

                            <div>
                                <Text type="secondary" style={{ display: 'block', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 8 }}>Password</Text>
                                <Input.Password value={fields.password} onChange={set('password')} placeholder="Min. 8 characters" autoComplete="new-password" size="large" status={fieldErrors.password ? 'error' : ''} />
                                {fieldErrors.password && <Text type="danger" style={{ fontSize: 12 }}>{fieldErrors.password[0]}</Text>}
                            </div>

                            <div>
                                <Text type="secondary" style={{ display: 'block', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 8 }}>Confirm Password</Text>
                                <Input.Password value={fields.password_confirmation} onChange={set('password_confirmation')} placeholder="••••••••" autoComplete="new-password" size="large" status={fieldErrors.password_confirmation ? 'error' : ''} />
                                {fieldErrors.password_confirmation && <Text type="danger" style={{ fontSize: 12 }}>{fieldErrors.password_confirmation[0]}</Text>}
                            </div>

                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                size="large"
                                loading={loading}
                                style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 4 }}
                            >
                                {loading ? 'Creating Account…' : 'Create Account'}
                            </Button>
                        </form>

                        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 28, fontSize: 13 }}>
                            Already have an account?{' '}
                            <Link href="/login" style={{ fontWeight: 600 }}>Sign in</Link>
                        </Text>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                            © {new Date().getFullYear()} PromptForm
                        </Text>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <Link href="/privacy-policy" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#aaa' }}>Privacy</Link>
                            <Link href="/terms" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#aaa' }}>Terms</Link>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT PANEL ── */}
                <div style={{ flex: 1, position: 'relative', background: '#060606', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 160, background: 'linear-gradient(180deg,#060606 0%,transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, background: 'linear-gradient(0deg,#060606 0%,transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: '30%', left: '30%', width: 400, height: 400, background: 'rgba(249,115,22,0.04)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }} />

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, padding: 20, height: '100%', width: '100%', transform: 'rotate(-5deg) scale(1.12)', transformOrigin: 'center center' }}>
                        <div style={{ marginTop: 48, overflow: 'hidden' }}>
                            <div className="pf-col-1" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {[...col1, ...col1].map((card, i) => <div key={i}>{card}</div>)}
                            </div>
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div className="pf-col-2" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {[...col2, ...col2].map((card, i) => <div key={i}>{card}</div>)}
                            </div>
                        </div>
                        <div style={{ marginTop: 80, overflow: 'hidden' }}>
                            <div className="pf-col-3" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {[...col3, ...col3].map((card, i) => <div key={i}>{card}</div>)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ position: 'fixed', top: 0, right: 0, width: 500, height: 500, background: 'rgba(249,115,22,0.04)', filter: 'blur(150px)', borderRadius: '50%', zIndex: -1, pointerEvents: 'none' }} />
        </>
    );
}
