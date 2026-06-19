import React, { useState } from 'react';
import { Input, Button, Checkbox, Divider, Typography, Alert } from 'antd';
import { Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { getRecaptchaToken } from '../../lib/recaptcha';

const { Title, Text } = Typography;

/* ─── Form card mockups for the right panel ─── */
function FieldCard({ children, style = {} }) {
    return (
        <div style={{
            background: '#111',
            border: '1px solid #222',
            borderRadius: 12,
            padding: '16px 18px',
            ...style,
        }}>
            {children}
        </div>
    );
}

function MockLabel({ text }) {
    return (
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#555', marginBottom: 8 }}>
            {text}
        </div>
    );
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

function MockButton({ label = 'Submit', style = {} }) {
    return (
        <div style={{
            height: 36, borderRadius: 7, background: '#f97316',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            ...style,
        }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff' }}>{label}</span>
        </div>
    );
}

const CARDS = [
    // 1. Contact form
    <FieldCard key="c1">
        <div style={{ fontSize: 10, fontWeight: 700, color: '#f97316', marginBottom: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Contact Us</div>
        <MockLabel text="Full Name" /><MockInput placeholder="John Doe" />
        <div style={{ marginTop: 10 }}><MockLabel text="Email" /><MockInput placeholder="email@example.com" focused /></div>
        <div style={{ marginTop: 10 }}><MockButton label="Send Message" /></div>
    </FieldCard>,

    // 2. Newsletter
    <FieldCard key="c2">
        <MockLabel text="Subscribe to Newsletter" />
        <MockInput placeholder="your@email.com" />
        <div style={{ marginTop: 10 }}><MockButton label="Subscribe" /></div>
    </FieldCard>,

    // 3. Survey radios
    <FieldCard key="c3">
        <MockLabel text="How did you hear about us?" />
        {['Social media', 'Google search', 'A friend', 'Advertisement'].map((opt, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${i === 1 ? '#f97316' : '#2a2a2a'}`, background: i === 1 ? '#f97316' : 'transparent', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#888' }}>{opt}</span>
            </div>
        ))}
    </FieldCard>,

    // 4. Checkboxes
    <FieldCard key="c4">
        <MockLabel text="Interests" />
        {['Design', 'Development', 'Marketing', 'Analytics'].map((opt, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${i < 2 ? '#f97316' : '#2a2a2a'}`, background: i < 2 ? '#f97316' : 'transparent', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: i < 2 ? '#ccc' : '#555' }}>{opt}</span>
            </div>
        ))}
    </FieldCard>,

    // 5. Star rating
    <FieldCard key="c5">
        <MockLabel text="Rate your experience" />
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {[1,2,3,4,5].map(i => (
                <div key={i} style={{ fontSize: 22, color: i <= 4 ? '#f97316' : '#2a2a2a' }}>★</div>
            ))}
        </div>
        <div style={{ fontSize: 10, color: '#444', marginTop: 8 }}>4 out of 5 stars</div>
    </FieldCard>,

    // 6. Textarea
    <FieldCard key="c6">
        <MockLabel text="Message" />
        <div style={{ height: 72, borderRadius: 7, border: '1px solid #2a2a2a', background: '#0a0a0a', padding: '10px 12px' }}>
            <span style={{ fontSize: 12, color: '#444', lineHeight: 1.5 }}>Tell us how we can help you today...</span>
        </div>
        <div style={{ marginTop: 10 }}><MockButton label="Send" /></div>
    </FieldCard>,

    // 7. File upload
    <FieldCard key="c7">
        <MockLabel text="Attach Files" />
        <div style={{
            height: 72, borderRadius: 7, border: '1.5px dashed #2a2a2a', background: '#0a0a0a',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}>
            <div style={{ fontSize: 18, color: '#333' }}>⬆</div>
            <span style={{ fontSize: 10, color: '#444' }}>Drop files here or click to upload</span>
        </div>
    </FieldCard>,

    // 8. Dropdown select
    <FieldCard key="c8">
        <MockLabel text="Country" />
        <div style={{
            height: 36, borderRadius: 7, border: '1px solid #2a2a2a', background: '#0a0a0a',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px',
        }}>
            <span style={{ fontSize: 12, color: '#888' }}>United States</span>
            <span style={{ fontSize: 10, color: '#444' }}>▾</span>
        </div>
        <div style={{ marginTop: 10 }}>
            <MockLabel text="City" />
            <MockInput placeholder="San Francisco" />
        </div>
    </FieldCard>,

    // 9. Range slider
    <FieldCard key="c9">
        <MockLabel text="Budget Range" />
        <div style={{ position: 'relative', height: 4, background: '#1a1a1a', borderRadius: 999, marginTop: 12 }}>
            <div style={{ position: 'absolute', left: 0, width: '60%', height: '100%', background: '#f97316', borderRadius: 999 }} />
            <div style={{ position: 'absolute', left: '60%', top: '50%', transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', background: '#f97316', border: '2px solid #fff' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <span style={{ fontSize: 10, color: '#555' }}>$0</span>
            <span style={{ fontSize: 10, color: '#f97316', fontWeight: 700 }}>$6,000</span>
            <span style={{ fontSize: 10, color: '#555' }}>$10,000</span>
        </div>
    </FieldCard>,

    // 10. Toggle / switch
    <FieldCard key="c10">
        <MockLabel text="Preferences" />
        {['Email notifications', 'SMS alerts', 'Weekly digest'].map((opt, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#888' }}>{opt}</span>
                <div style={{
                    width: 34, height: 18, borderRadius: 999, background: i === 0 ? '#f97316' : '#222',
                    position: 'relative', flexShrink: 0,
                }}>
                    <div style={{ position: 'absolute', top: 2, left: i === 0 ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>
            </div>
        ))}
    </FieldCard>,

    // 11. Multi-step progress
    <FieldCard key="c11">
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 14 }}>
            {[1,2,3].map((step, i) => (
                <React.Fragment key={step}>
                    <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: step < 3 ? '#f97316' : '#222',
                        border: step === 3 ? '2px solid #333' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: step < 3 ? '#fff' : '#444',
                    }}>{step}</div>
                    {i < 2 && <div style={{ flex: 1, height: 2, background: step < 2 ? '#f97316' : '#222' }} />}
                </React.Fragment>
            ))}
        </div>
        <MockLabel text="Your Details" />
        <MockInput placeholder="Company name" />
    </FieldCard>,

    // 12. AI generating card
    <FieldCard key="c12" style={{ background: '#0d0d0d' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#f97316', letterSpacing: '0.15em', textTransform: 'uppercase' }}>AI Building Form</span>
        </div>
        {['Name field', 'Email field', 'Message field'].map((f, i) => (
            <div key={i} style={{ height: 10, background: i < 2 ? '#1e1e1e' : '#161616', borderRadius: 4, marginBottom: 7, width: i === 2 ? '70%' : '100%' }} />
        ))}
        <div style={{ height: 28, borderRadius: 6, background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', marginTop: 10 }} />
    </FieldCard>,

    // 13. Date picker
    <FieldCard key="c13">
        <MockLabel text="Appointment Date" />
        <div style={{
            height: 36, borderRadius: 7, border: '1px solid #f97316', background: '#0a0a0a',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px',
            boxShadow: '0 0 0 2px rgba(249,115,22,0.1)',
        }}>
            <span style={{ fontSize: 12, color: '#ccc' }}>May 20, 2026</span>
            <span style={{ fontSize: 14, color: '#f97316' }}>📅</span>
        </div>
    </FieldCard>,

    // 14. Success state
    <FieldCard key="c14" style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(249,115,22,0.12)', border: '1.5px solid rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 18 }}>
            ✓
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Form Submitted!</div>
        <div style={{ fontSize: 11, color: '#555' }}>We'll get back to you within 24 hours</div>
    </FieldCard>,

    // 15. Phone field
    <FieldCard key="c15">
        <MockLabel text="Phone Number" />
        <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 56, height: 36, borderRadius: 7, border: '1px solid #2a2a2a', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#888' }}>🇺🇸</div>
            <MockInput placeholder="+1 (555) 123-4567" />
        </div>
    </FieldCard>,
];

const col1 = CARDS.filter((_, i) => i % 3 === 0);
const col2 = CARDS.filter((_, i) => i % 3 === 1);
const col3 = CARDS.filter((_, i) => i % 3 === 2);

/* ─── Main component ─── */
export default function Login() {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    const { recaptchaSiteKey } = usePage().props;

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setFieldErrors({});
        try {
            const recaptcha_token = await getRecaptchaToken('login', recaptchaSiteKey);
            const { data } = await axios.post('/auth/login', { email, password, remember, recaptcha_token });
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
                <div style={{ width: '45%', minWidth: 400, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 64px' }}>

                    <Link href="/">
                        <img src="/images/icon.png" alt="PromptForm" style={{ height: 44, width: 'auto' }} />
                    </Link>

                    <div style={{ maxWidth: 400, width: '100%', margin: '0 auto' }}>

                        <div style={{ marginBottom: 40 }}>
                            <Title style={{ fontFamily: "'Manrope', sans-serif", fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 10px', lineHeight: 1.1 }}>
                                Welcome Back
                            </Title>
                            <Text type="secondary" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                                Sign in to your PromptForm account.
                            </Text>
                        </div>

                        {error && <Alert message={error} type="error" style={{ marginBottom: 24 }} />}

                        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                            <div>
                                <Text type="secondary" style={{ display: 'block', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 8 }}>
                                    Email Address
                                </Text>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    autoComplete="username"
                                    autoFocus
                                    size="large"
                                    status={fieldErrors.email ? 'error' : ''}
                                />
                                {fieldErrors.email && <Text type="danger" style={{ fontSize: 12 }}>{fieldErrors.email[0]}</Text>}
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <Text type="secondary" style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.18em' }}>
                                        Password
                                    </Text>
                                </div>
                                <Input.Password
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    size="large"
                                    status={fieldErrors.password ? 'error' : ''}
                                />
                                {fieldErrors.password && <Text type="danger" style={{ fontSize: 12 }}>{fieldErrors.password[0]}</Text>}
                            </div>

                            <Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)}>
                                Remember me
                            </Checkbox>

                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                size="large"
                                loading={loading}
                                style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase' }}
                            >
                                {loading ? 'Signing In…' : 'Sign In'}
                            </Button>
                        </form>

                        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 20, fontSize: 13 }}>
                            Don't have an account?{' '}
                            <Link href="/register" style={{ fontWeight: 600 }}>Sign up</Link>
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
                    {/* Top fade */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 160, background: 'linear-gradient(180deg,#060606 0%,transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
                    {/* Bottom fade */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, background: 'linear-gradient(0deg,#060606 0%,transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />

                    {/* Orange ambient glow */}
                    <div style={{ position: 'absolute', top: '30%', left: '30%', width: 400, height: 400, background: 'rgba(249,115,22,0.04)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }} />

                    {/* Rotated 3-column grid */}
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

            {/* Ambient glow behind left panel */}
            <div style={{ position: 'fixed', top: 0, right: 0, width: 500, height: 500, background: 'rgba(249,115,22,0.04)', filter: 'blur(150px)', borderRadius: '50%', zIndex: -1, pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: 0, left: 0, width: 300, height: 300, background: 'rgba(249,115,22,0.03)', filter: 'blur(120px)', borderRadius: '50%', zIndex: -1, pointerEvents: 'none' }} />
        </>
    );
}
