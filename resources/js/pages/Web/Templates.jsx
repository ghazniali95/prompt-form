import React, { useState } from 'react';
import {
    Button, Card, Col, Input, Row, Tag, Typography,
    Select, Spin, message, Modal,
} from 'antd';
import {
    SearchOutlined, RobotOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { router } from '@inertiajs/react';
import AuthLayout from '@layouts/AuthLayout';

const { Title, Text } = Typography;

const TEMPLATES = [
    {
        id: 'contact',
        name: 'Contact Us',
        description: 'A clean contact form for customers to reach your team.',
        category: 'Customer Service',
        emoji: '📬',
        fields: ['Name', 'Email', 'Subject', 'Message'],
        prompt: 'Create a professional contact form with: full name, email address, subject (dropdown: General Inquiry, Order Issue, Shipping, Returns, Other), and a message textarea. Validate required fields and email format.',
    },
    {
        id: 'newsletter',
        name: 'Newsletter Signup',
        description: 'Grow your mailing list with a minimal signup form.',
        category: 'Lead Generation',
        emoji: '📧',
        fields: ['First Name', 'Last Name', 'Email'],
        prompt: 'Create a newsletter signup form with first name, last name, email, and a consent checkbox ("I agree to receive marketing emails"). Modern, minimal design with a Subscribe button.',
    },
    {
        id: 'feedback',
        name: 'Product Feedback',
        description: 'Collect structured customer opinions on your products.',
        category: 'Feedback',
        emoji: '⭐',
        fields: ['Name', 'Email', 'Product', 'Rating', 'Review'],
        prompt: 'Create a product feedback form with: customer name, email, product name, star rating (1–5), written review textarea, and a "Would you recommend this?" checkbox.',
    },
    {
        id: 'lead',
        name: 'Lead Generation',
        description: 'Capture qualified B2B leads with key business details.',
        category: 'Lead Generation',
        emoji: '🎯',
        fields: ['Name', 'Company', 'Email', 'Budget', 'Interest'],
        prompt: 'Create a lead generation form with: full name, company name, business email, phone, estimated budget (dropdown: Under $1k, $1k–$5k, $5k–$20k, $20k+), and primary interest. Professional style with a "Get Started" button.',
    },
    {
        id: 'event',
        name: 'Event Registration',
        description: 'Register attendees for in-store events or workshops.',
        category: 'Events',
        emoji: '🎟️',
        fields: ['Name', 'Email', 'Ticket Type', 'Dietary', 'Guests'],
        prompt: 'Create an event registration form with: full name, email, ticket type (General, VIP, Online), number of attendees, dietary requirements (checkboxes), and special requests. Use a "Register Now" button.',
    },
    {
        id: 'support',
        name: 'Support Ticket',
        description: 'Let customers report issues and get structured help.',
        category: 'Customer Service',
        emoji: '🛠️',
        fields: ['Name', 'Email', 'Issue Type', 'Description', 'Priority'],
        prompt: 'Create a support ticket form with: name, email, order number (optional), issue type (dropdown: Order, Shipping, Return, Technical, Other), description textarea, urgency (Low/Medium/High radio). Button: "Submit Ticket".',
    },
    {
        id: 'survey',
        name: 'Customer Survey',
        description: 'Measure satisfaction and gather actionable insights.',
        category: 'Feedback',
        emoji: '📊',
        fields: ['NPS Score', 'Satisfaction', 'Improvements', 'Comments'],
        prompt: 'Create a customer satisfaction survey with: overall satisfaction rating (1–5), NPS score (0–10), what they liked (textarea), what to improve (textarea), and optional email. Button: "Submit Survey".',
    },
    {
        id: 'wholesale',
        name: 'Wholesale Inquiry',
        description: 'Qualify wholesale and B2B partnership requests.',
        category: 'Sales',
        emoji: '🤝',
        fields: ['Business Name', 'Contact', 'Email', 'Products', 'Volume'],
        prompt: 'Create a wholesale inquiry form with: business name, contact person, email, phone, business type (Retailer/Distributor/Reseller/Other), products interested in, expected monthly volume (dropdown). Button: "Submit Inquiry".',
    },
    {
        id: 'return',
        name: 'Return & Refund',
        description: 'Streamline your returns with a structured request form.',
        category: 'Customer Service',
        emoji: '↩️',
        fields: ['Name', 'Order #', 'Item', 'Reason', 'Resolution'],
        prompt: 'Create a return and refund form with: name, email, order number, item name, return reason (dropdown), description, preferred resolution (Refund/Exchange/Store Credit radio), and item condition. Button: "Submit Request".',
    },
    {
        id: 'quiz',
        name: 'Product Quiz',
        description: 'Help customers find the perfect product via guided questions.',
        category: 'Sales',
        emoji: '🔍',
        fields: ['Use Case', 'Budget', 'Preference', 'Experience'],
        prompt: 'Create a product recommendation quiz with multiple-choice questions: primary use case (4 options), budget range (4 options), key preference (Quality/Price/Features/Style), experience level (Beginner/Intermediate/Expert). Engaging style. Button: "Find My Match".',
    },
    {
        id: 'appointment',
        name: 'Appointment Booking',
        description: 'Schedule consultations or in-store appointments.',
        category: 'Bookings',
        emoji: '📅',
        fields: ['Name', 'Email', 'Service', 'Date', 'Time', 'Notes'],
        prompt: 'Create an appointment booking form with: name, email, phone, service type (dropdown), preferred date (date picker), preferred time slot (dropdown), alternative date (optional), and notes. Button: "Book Appointment".',
    },
    {
        id: 'job',
        name: 'Job Application',
        description: 'Collect structured job applications directly on-site.',
        category: 'HR',
        emoji: '💼',
        fields: ['Name', 'Email', 'Position', 'Experience', 'Portfolio'],
        prompt: 'Create a job application form with: name, email, phone, position applying for, years of experience (dropdown), portfolio/resume URL, cover letter textarea, availability to start, and how they heard about the role. Button: "Submit Application".',
    },
];

const CATEGORIES = ['All', ...new Set(TEMPLATES.map(t => t.category))];

const CATEGORY_COLORS = {
    'Customer Service': 'blue',
    'Lead Generation':  'green',
    'Feedback':         'orange',
    'Events':           'purple',
    'Sales':            'red',
    'Bookings':         'cyan',
    'HR':               'volcano',
};

export default function Templates({ user }) {
    const [search, setSearch]       = useState('');
    const [category, setCategory]   = useState('All');
    const [creating, setCreating]   = useState(null);
    const [preview, setPreview]     = useState(null);

    const filtered = TEMPLATES.filter(t => {
        const matchCat    = category === 'All' || t.category === category;
        const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase())
            || t.description.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    const handleUseTemplate = async (template) => {
        setCreating(template.id);
        try {
            const { data } = await axios.post('/api/v1/forms', { title: template.name });
            const form = data.data;
            // Send the template prompt as the first chat message
            await axios.post(`/api/v1/forms/${form.id}/chat`, { message: template.prompt });
            message.success(`"${template.name}" form created! Opening editor…`);
            router.visit('/forms');
        } catch (err) {
            message.error(err.response?.data?.message ?? 'Failed to create form. Please try again.');
        } finally {
            setCreating(null);
        }
    };

    return (
        <AuthLayout user={user}>
            <div style={{ padding: '40px' }}>

                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <Title level={3} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>
                        Templates
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        Start with a pre-built form and let AI customise it for you.
                    </Text>
                </div>

                {/* Toolbar */}
                <Row gutter={[12, 12]} style={{ marginBottom: 24 }} align="middle">
                    <Col flex="1">
                        <Input
                            prefix={<SearchOutlined style={{ color: '#ccc' }} />}
                            placeholder="Search templates…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            allowClear
                            style={{ maxWidth: 320 }}
                        />
                    </Col>
                    <Col>
                        <Select
                            value={category}
                            onChange={setCategory}
                            style={{ minWidth: 160 }}
                            options={CATEGORIES.map(c => ({ label: c, value: c }))}
                        />
                    </Col>
                </Row>

                {/* Template grid */}
                <Row gutter={[16, 16]}>
                    {filtered.map(template => (
                        <Col xs={24} sm={12} lg={8} key={template.id}>
                            <Card
                                style={{
                                    borderRadius: 14,
                                    border: '1px solid #f0f0f0',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                    height: '100%',
                                    transition: 'box-shadow 0.2s, border-color 0.2s',
                                }}
                                styles={{ body: { padding: '24px' } }}
                                hoverable
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
                                    {/* Emoji + title */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                        <div style={{
                                            fontSize: 28, lineHeight: 1,
                                            width: 48, height: 48, display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            background: '#fff8f3', borderRadius: 10,
                                            flexShrink: 0,
                                        }}>
                                            {template.emoji}
                                        </div>
                                        <div>
                                            <Text strong style={{ fontSize: 15, display: 'block', lineHeight: 1.3 }}>
                                                {template.name}
                                            </Text>
                                            <Tag
                                                color={CATEGORY_COLORS[template.category] ?? 'default'}
                                                style={{ marginTop: 4, fontSize: 11, borderRadius: 4 }}
                                            >
                                                {template.category}
                                            </Tag>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
                                        {template.description}
                                    </Text>

                                    {/* Fields */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                        {template.fields.map(f => (
                                            <Tag key={f} style={{ fontSize: 11, borderRadius: 4, margin: 0, background: '#fafafa' }}>
                                                {f}
                                            </Tag>
                                        ))}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', gap: 8 }}>
                                        <Button
                                            type="primary"
                                            icon={<RobotOutlined />}
                                            loading={creating === template.id}
                                            disabled={!!creating && creating !== template.id}
                                            onClick={() => handleUseTemplate(template)}
                                            style={{ fontWeight: 700, flex: 1 }}
                                        >
                                            Use Template
                                        </Button>
                                        <Button
                                            onClick={() => setPreview(template)}
                                            style={{ color: '#888' }}
                                        >
                                            Preview
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    ))}

                    {filtered.length === 0 && (
                        <Col span={24}>
                            <Card style={{ borderRadius: 12, textAlign: 'center', padding: '48px 0', border: '1px solid #f0f0f0' }}>
                                <AppstoreOutlined style={{ fontSize: 40, color: '#ddd', marginBottom: 12 }} />
                                <div><Text type="secondary">No templates match your search.</Text></div>
                            </Card>
                        </Col>
                    )}
                </Row>
            </div>

            {/* Preview modal */}
            <Modal
                open={!!preview}
                onCancel={() => setPreview(null)}
                title={
                    preview && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 20 }}>{preview.emoji}</span>
                            <span>{preview.name}</span>
                        </div>
                    )
                }
                footer={[
                    <Button key="cancel" onClick={() => setPreview(null)}>Close</Button>,
                    <Button
                        key="use"
                        type="primary"
                        icon={<RobotOutlined />}
                        loading={creating === preview?.id}
                        onClick={() => { const t = preview; setPreview(null); handleUseTemplate(t); }}
                        style={{ fontWeight: 700 }}
                    >
                        Use Template
                    </Button>,
                ]}
                width={520}
            >
                {preview && (
                    <div style={{ padding: '12px 0' }}>
                        <Tag color={CATEGORY_COLORS[preview.category] ?? 'default'} style={{ marginBottom: 12 }}>
                            {preview.category}
                        </Tag>
                        <Text style={{ display: 'block', fontSize: 14, lineHeight: 1.7, marginBottom: 20, color: '#555' }}>
                            {preview.description}
                        </Text>
                        <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>
                            Fields included
                        </Text>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                            {preview.fields.map(f => (
                                <Tag key={f} style={{ borderRadius: 4 }}>{f}</Tag>
                            ))}
                        </div>
                        <div style={{ background: '#fafafa', borderRadius: 8, padding: '12px 16px', border: '1px solid #f0f0f0' }}>
                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                AI prompt
                            </Text>
                            <Text style={{ fontSize: 13, lineHeight: 1.6, color: '#555' }}>{preview.prompt}</Text>
                        </div>
                    </div>
                )}
            </Modal>
        </AuthLayout>
    );
}
