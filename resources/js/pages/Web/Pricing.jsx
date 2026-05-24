import React, { useState, useEffect } from 'react';
import {
    Button, Card, Col, Divider, Row, Tag, Typography,
    Modal, Table, Spin, message, Alert,
} from 'antd';
import {
    CheckOutlined, CrownOutlined, CreditCardOutlined,
    FileTextOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import AuthLayout from '@layouts/AuthLayout';

const { Title, Text } = Typography;

const PLAN_META = {
    free: {
        description: 'Everything you need to get started with AI-powered forms.',
        features: [
            '1 active form',
            '50 submissions / month',
            'AI form builder',
            'Public storefront widget',
        ],
        highlight: false,
    },
    starter: {
        description: 'For growing stores ready to collect more responses.',
        features: [
            '5 active forms',
            '1,000 submissions / month',
            'AI form builder',
            'Submissions export (CSV)',
            'Email notifications',
            'Priority support',
        ],
        highlight: false,
    },
    growing: {
        description: 'Unlimited scale for high-traffic stores.',
        features: [
            'Unlimited forms',
            'Unlimited submissions',
            'AI form builder',
            'Webhook integrations',
            'Advanced analytics',
            'Custom branding',
            'Dedicated support',
        ],
        highlight: true,
    },
};

function PlanCard({ plan, currentPlan, onSubscribe, subscribing }) {
    const meta      = PLAN_META[plan.slug] ?? {};
    const isCurrent = currentPlan === plan.slug;
    const isDowngrade = plan.price < (PLAN_META[currentPlan]?.price ?? 0);

    return (
        <div style={{ position: 'relative', height: '100%' }}>
            {meta.highlight && (
                <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 1, background: '#f97316', color: '#fff',
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', padding: '3px 12px', borderRadius: 20,
                    whiteSpace: 'nowrap',
                }}>
                    Most Popular
                </div>
            )}
            <Card
                style={{
                    borderRadius: 16,
                    border: meta.highlight ? '2px solid #f97316' : '1px solid #f0f0f0',
                    boxShadow: meta.highlight ? '0 4px 24px rgba(249,115,22,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                    height: '100%',
                }}
                styles={{ body: { padding: '28px 24px' } }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text strong style={{ fontSize: 18 }}>{plan.name}</Text>
                            {isCurrent && <Tag color="processing">Current plan</Tag>}
                        </div>
                        <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.5 }}>{meta.description}</Text>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 40, fontWeight: 800, color: '#111', lineHeight: 1 }}>
                            ${plan.price}
                        </span>
                        {plan.price > 0 && <Text type="secondary" style={{ fontSize: 14 }}>&nbsp;/ month</Text>}
                    </div>

                    <Divider style={{ margin: '4px 0' }} />

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(meta.features ?? []).map(f => (
                            <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                <CheckOutlined style={{ color: '#f97316', fontSize: 13, marginTop: 2, flexShrink: 0 }} />
                                <Text style={{ fontSize: 14, lineHeight: 1.5 }}>{f}</Text>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                        {isCurrent ? (
                            <Button block disabled size="large" style={{ borderRadius: 10 }}>
                                Current plan
                            </Button>
                        ) : plan.is_free ? (
                            <Button block size="large" disabled style={{ borderRadius: 10 }}>
                                Free forever
                            </Button>
                        ) : (
                            <Button
                                block
                                size="large"
                                type={meta.highlight ? 'primary' : 'default'}
                                loading={subscribing === plan.slug}
                                onClick={() => onSubscribe(plan)}
                                style={{ borderRadius: 10, fontWeight: 700 }}
                                icon={meta.highlight ? <CrownOutlined /> : null}
                            >
                                {isDowngrade ? `Switch to ${plan.name}` : `Upgrade to ${plan.name}`}
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default function Pricing({ user, subscription }) {
    const { props } = usePage();
    const flash     = props.flash ?? {};

    const [plans,       setPlans]       = useState([]);
    const [billing,     setBilling]     = useState(null);
    const [invoices,    setInvoices]    = useState([]);
    const [loadingInit, setLoadingInit] = useState(true);
    const [subscribing, setSubscribing] = useState(null);

    // ── Load plans + billing info ─────────────────────────────────────────────

    useEffect(() => {
        Promise.all([
            axios.get('/api/v1/billing/plans'),
            axios.get('/api/v1/billing/current'),
            axios.get('/api/v1/billing/invoices'),
        ])
            .then(([plansRes, billingRes, invoicesRes]) => {
                setPlans(plansRes.data.data ?? []);
                setBilling(billingRes.data.data);
                setInvoices(invoicesRes.data.data ?? []);
            })
            .finally(() => setLoadingInit(false));
    }, []);

    // ── Flash messages ────────────────────────────────────────────────────────

    useEffect(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.get('billing_success')) {
            message.success('Subscription activated successfully!');
        } else if (url.searchParams.get('billing_cancelled')) {
            message.info('Checkout was cancelled.');
        } else if (url.searchParams.get('billing_error')) {
            message.error('Something went wrong with your subscription. Please try again.');
        }
    }, []);

    // ── Subscribe ─────────────────────────────────────────────────────────────

    const handleSubscribe = async (plan) => {
        setSubscribing(plan.slug);
        try {
            const { data } = await axios.post('/api/v1/billing/subscribe', { plan_slug: plan.slug });
            const { checkout_url } = data.data;
            window.location.href = checkout_url;
        } catch (err) {
            message.error(err.response?.data?.error ?? 'Failed to start checkout. Please try again.');
            setSubscribing(null);
        }
    };

    // ── Cancel ────────────────────────────────────────────────────────────────

    const handleCancel = () => {
        Modal.confirm({
            title:   'Cancel subscription?',
            icon:    <ExclamationCircleOutlined />,
            content: 'You will lose access to paid features at the end of your current billing period.',
            okText:  'Yes, cancel',
            okType:  'danger',
            onOk: () => axios.post('/api/v1/billing/cancel')
                .then(() => {
                    setBilling(prev => prev ? { ...prev, status: 'cancelled', plan: 'free' } : prev);
                    message.success('Subscription cancelled.');
                })
                .catch(() => message.error('Failed to cancel subscription.')),
        });
    };

    // ── Invoice table ─────────────────────────────────────────────────────────

    const invoiceColumns = [
        {
            title:  'Date',
            key:    'date',
            width:  130,
            render: (_, r) => (
                <Text type="secondary" style={{ fontSize: 13 }}>
                    {r.invoice_date ? new Date(r.invoice_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </Text>
            ),
        },
        { title: 'Plan', dataIndex: 'plan_name', key: 'plan_name', render: v => <Text>{v ?? '—'}</Text> },
        {
            title:  'Amount',
            key:    'amount',
            width:  110,
            render: (_, r) => <Text strong>${r.amount?.toFixed(2)} {r.currency}</Text>,
        },
        {
            title:     'Status',
            dataIndex: 'status',
            key:       'status',
            width:     100,
            render: s => <Tag color={s === 'paid' ? 'success' : 'warning'}>{s}</Tag>,
        },
        {
            title:  '',
            key:    'link',
            width:  80,
            render: (_, r) => r.hosted_invoice_url
                ? <a href={r.hosted_invoice_url} target="_blank" rel="noreferrer" style={{ color: '#f97316', fontSize: 13 }}>View</a>
                : null,
        },
    ];

    const currentPlan = billing?.plan ?? subscription?.plan_slug ?? 'free';
    const isActive    = billing?.status === 'active';

    return (
        <AuthLayout user={user}>
            <div style={{ padding: '40px' }}>

                {/* Header */}
                <div style={{ marginBottom: 40, textAlign: 'center' }}>
                    <Title level={2} style={{ fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
                        Simple, transparent pricing
                    </Title>
                    <Text type="secondary" style={{ fontSize: 15 }}>
                        Start free, upgrade when you're ready. No surprises, cancel anytime.
                    </Text>
                </div>

                <Spin spinning={loadingInit}>

                    {/* Active subscription banner */}
                    {isActive && billing?.plan !== 'free' && (
                        <div style={{ maxWidth: 960, margin: '0 auto 24px' }}>
                            <Alert
                                type="info"
                                showIcon
                                message={
                                    <span>
                                        You're on the <strong>{billing.plan_name}</strong> plan
                                        {billing.pm_last_four && ` · ${billing.pm_type ?? 'Card'} ending ${billing.pm_last_four}`}.
                                        &nbsp;
                                        <a onClick={handleCancel} style={{ color: '#f5222d', cursor: 'pointer' }}>
                                            Cancel subscription
                                        </a>
                                    </span>
                                }
                            />
                        </div>
                    )}

                    {/* Plan cards */}
                    <Row gutter={[20, 20]} justify="center" style={{ maxWidth: 960, margin: '0 auto 40px' }}>
                        {plans.map(plan => (
                            <Col xs={24} sm={24} md={8} key={plan.slug}>
                                <PlanCard
                                    plan={plan}
                                    currentPlan={currentPlan}
                                    onSubscribe={handleSubscribe}
                                    subscribing={subscribing}
                                />
                            </Col>
                        ))}
                    </Row>

                    {/* Invoices */}
                    {invoices.length > 0 && (
                        <div style={{ maxWidth: 960, margin: '0 auto 40px' }}>
                            <Card
                                title={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <FileTextOutlined style={{ color: '#f97316' }} />
                                        <span style={{ fontWeight: 700 }}>Billing History</span>
                                    </div>
                                }
                                style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
                                styles={{ body: { padding: 0 } }}
                            >
                                <Table
                                    dataSource={invoices}
                                    columns={invoiceColumns}
                                    rowKey="id"
                                    pagination={false}
                                    size="small"
                                    style={{ borderRadius: 12, overflow: 'hidden' }}
                                />
                            </Card>
                        </div>
                    )}

                    {/* FAQ */}
                    <div style={{ maxWidth: 700, margin: '0 auto' }}>
                        <Title level={4} style={{ fontWeight: 700, marginBottom: 20, textAlign: 'center' }}>
                            Frequently asked questions
                        </Title>
                        {[
                            {
                                q: 'Can I switch plans at any time?',
                                a: 'Yes. You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
                            },
                            {
                                q: 'What happens when I hit my submission limit?',
                                a: 'New submissions will be paused until the next billing cycle or you upgrade your plan. Existing responses are never deleted.',
                            },
                            {
                                q: 'Is there a free trial for paid plans?',
                                a: 'The Free plan lets you explore core features without a time limit. Paid plans offer a 7-day money-back guarantee.',
                            },
                            {
                                q: 'Do you offer refunds?',
                                a: "We offer a 7-day refund on any paid plan if you're not satisfied. Contact support to request a refund.",
                            },
                        ].map(({ q, a }) => (
                            <Card
                                key={q}
                                style={{ borderRadius: 12, border: '1px solid #f0f0f0', marginBottom: 12 }}
                                styles={{ body: { padding: '18px 22px' } }}
                            >
                                <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>{q}</Text>
                                <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.7 }}>{a}</Text>
                            </Card>
                        ))}
                    </div>

                </Spin>
            </div>
        </AuthLayout>
    );
}
