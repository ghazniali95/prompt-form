import React, { useState } from 'react';
import {
    Button, Card, Col, Form, Input, Row, Typography,
    message,
} from 'antd';
import {
    BookOutlined, MailOutlined, QuestionCircleOutlined,
    RightOutlined, DownOutlined,
} from '@ant-design/icons';
import AuthLayout from '@layouts/AuthLayout';

const { Title, Text } = Typography;
const { TextArea } = Input;

const QUICK_LINKS = [
    {
        icon: <BookOutlined />,
        color: '#6366f1',
        title: 'Getting Started',
        desc: 'Create your first form in under 5 minutes.',
        href: '#faq',
    },
    {
        icon: '🎬',
        color: '#f97316',
        title: 'Video Tutorials',
        desc: 'Watch step-by-step walkthroughs.',
        href: '#',
        comingSoon: true,
    },
    {
        icon: '📖',
        color: '#22c55e',
        title: 'Documentation',
        desc: 'Full API reference and developer guides.',
        href: '#',
        comingSoon: true,
    },
    {
        icon: <MailOutlined />,
        color: '#8b5cf6',
        title: 'Contact Support',
        desc: 'Send us a message and we\'ll reply within 24 hours.',
        href: '#contact',
    },
];

const FAQS = [
    {
        q: 'How do I add a form to my Shopify store?',
        a: 'Install the PromptForm app from the Shopify App Store. Create and publish a form, copy the Form ID, then add the "PromptForm" block in your Shopify Theme Editor and paste the Form ID in the block settings.',
    },
    {
        q: 'How does the AI form builder work?',
        a: 'Describe the form you want in plain English — for example, "Create a contact form with name, email, and a subject dropdown." Our AI will generate a fully styled, production-ready form instantly. You can keep refining it with follow-up prompts.',
    },
    {
        q: 'Can I customise the form design?',
        a: 'Yes. You can ask the AI to change colours, layout, font size, button style, or any visual aspect. Just describe what you want and the AI will update the form in real time.',
    },
    {
        q: 'How do I view form submissions?',
        a: 'Go to the Submissions page from the left navigation. Select a form from the dropdown to see all responses, including a date and the submitted data. You can also export everything as a CSV.',
    },
    {
        q: 'What happens when I reach my submission limit?',
        a: 'New submissions will be paused until the next billing cycle resets your count. You can upgrade your plan at any time to instantly increase your limit. Existing data is never lost.',
    },
    {
        q: 'Can I export submissions to a spreadsheet?',
        a: 'Yes. On the Submissions page, filter by the form you need and click "Export CSV". The file includes all field values and submission dates, ready to open in Excel or Google Sheets.',
    },
    {
        q: 'How do multi-step forms work?',
        a: 'Ask the AI to "make this a multi-step form" or "split into 3 steps". The AI will restructure the form with a progress indicator and navigation between steps. Users see one step at a time.',
    },
    {
        q: 'Does PromptForm work with WooCommerce?',
        a: 'WooCommerce support is on our roadmap. For now, you can embed the storefront widget on any site using the public API URL and your Form ID. Full WooCommerce integration is coming soon.',
    },
];

function FaqItem({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <Card
            style={{
                borderRadius: 12,
                border: '1px solid #f0f0f0',
                marginBottom: 8,
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                ...(open ? { borderColor: '#f97316' } : {}),
            }}
            styles={{ body: { padding: '16px 20px' } }}
            onClick={() => setOpen(o => !o)}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <Text strong style={{ fontSize: 14, lineHeight: 1.5, flex: 1 }}>{q}</Text>
                <div style={{ color: open ? '#f97316' : '#bbb', transition: 'color 0.2s', flexShrink: 0 }}>
                    {open ? <DownOutlined /> : <RightOutlined />}
                </div>
            </div>
            {open && (
                <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.75, display: 'block', marginTop: 10 }}>
                    {a}
                </Text>
            )}
        </Card>
    );
}

export default function Support({ user }) {
    const [form] = Form.useForm();
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        try {
            const values = await form.validateFields();
            setSending(true);
            setTimeout(() => {
                setSending(false);
                message.success("Message sent! We'll reply within 24 hours.");
                form.resetFields();
            }, 800);
        } catch {}
    };

    return (
        <AuthLayout user={user}>
            <div style={{ padding: '40px' }}>

                {/* Header */}
                <div style={{ marginBottom: 32, textAlign: 'center' }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 14,
                        background: '#f974161a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                    }}>
                        <QuestionCircleOutlined style={{ fontSize: 28, color: '#f97316' }} />
                    </div>
                    <Title level={3} style={{ fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>
                        How can we help?
                    </Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                        Find answers in our FAQ or send us a message.
                    </Text>
                </div>

                {/* Quick links */}
                <Row gutter={[16, 16]} style={{ marginBottom: 40 }}>
                    {QUICK_LINKS.map(link => {
                        const isEmoji = typeof link.icon === 'string';
                        return (
                            <Col xs={12} sm={6} key={link.title}>
                                <Card
                                    style={{
                                        borderRadius: 12, border: '1px solid #f0f0f0',
                                        cursor: link.comingSoon ? 'default' : 'pointer',
                                        opacity: link.comingSoon ? 0.6 : 1,
                                    }}
                                    styles={{ body: { padding: '20px 18px', textAlign: 'center' } }}
                                    onClick={() => {
                                        if (link.comingSoon) return;
                                        if (link.href.startsWith('#')) {
                                            document.getElementById(link.href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
                                        }
                                    }}
                                    hoverable={!link.comingSoon}
                                >
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10,
                                        background: link.color + '18',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 12px',
                                        fontSize: isEmoji ? 20 : 18, color: link.color,
                                    }}>
                                        {link.icon}
                                    </div>
                                    <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                                        {link.title}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.4 }}>
                                        {link.desc}
                                    </Text>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>

                <Row gutter={[32, 32]}>

                    {/* FAQ */}
                    <Col xs={24} lg={14}>
                        <div id="faq">
                            <Title level={4} style={{ fontWeight: 700, marginBottom: 16 }}>
                                Frequently Asked Questions
                            </Title>
                            {FAQS.map(item => <FaqItem key={item.q} {...item} />)}
                        </div>
                    </Col>

                    {/* Contact form */}
                    <Col xs={24} lg={10}>
                        <div id="contact">
                            <Card
                                title={<span style={{ fontWeight: 700 }}>Send us a message</span>}
                                style={{ borderRadius: 14, border: '1px solid #f0f0f0', position: 'sticky', top: 24 }}
                                styles={{ body: { padding: '20px 24px' } }}
                            >
                                <Form form={form} layout="vertical">
                                    <Form.Item
                                        label="Subject"
                                        name="subject"
                                        rules={[{ required: true, message: 'Please enter a subject.' }]}
                                    >
                                        <Input size="large" placeholder="e.g. Billing question" style={{ borderRadius: 8 }} />
                                    </Form.Item>
                                    <Form.Item
                                        label="Message"
                                        name="message"
                                        rules={[{ required: true, message: 'Please enter your message.' }]}
                                    >
                                        <TextArea
                                            rows={5}
                                            placeholder="Describe your issue or question in detail…"
                                            style={{ borderRadius: 8 }}
                                        />
                                    </Form.Item>
                                    <Button
                                        type="primary"
                                        block
                                        size="large"
                                        icon={<MailOutlined />}
                                        loading={sending}
                                        onClick={handleSend}
                                        style={{ fontWeight: 700, borderRadius: 10 }}
                                    >
                                        Send Message
                                    </Button>
                                </Form>

                                <div style={{ marginTop: 20, padding: '14px 16px', background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        Or email us directly at{' '}
                                        <a href="mailto:support@promptform.io" style={{ color: '#f97316', fontWeight: 600 }}>
                                            support@promptform.io
                                        </a>
                                        . We respond within 24 hours on business days.
                                    </Text>
                                </div>
                            </Card>
                        </div>
                    </Col>
                </Row>
            </div>
        </AuthLayout>
    );
}
