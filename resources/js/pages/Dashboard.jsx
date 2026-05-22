import React from 'react';
import { Typography, Row, Col, Card } from 'antd';
import { FileTextOutlined, AppstoreOutlined, BarChartOutlined, ApiOutlined } from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import AuthLayout from '@layouts/AuthLayout';

const { Title, Text } = Typography;

const QUICK_LINKS = [
    {
        icon: <FileTextOutlined style={{ fontSize: 20, color: '#fff' }} />,
        title: 'Forms',
        desc: 'View and manage your AI-generated forms.',
        action: 'View Forms',
        href: '/dashboard/forms',
    },
    {
        icon: <AppstoreOutlined style={{ fontSize: 20, color: '#fff' }} />,
        title: 'Templates',
        desc: 'Start fast with pre-built form templates.',
        action: 'Browse Templates',
        href: '/dashboard/templates',
    },
    {
        icon: <BarChartOutlined style={{ fontSize: 20, color: '#fff' }} />,
        title: 'Analytics',
        desc: 'Track form views, submissions, and trends.',
        action: 'View Analytics',
        href: '/dashboard/analytics',
    },
    {
        icon: <ApiOutlined style={{ fontSize: 20, color: '#fff' }} />,
        title: 'Integrations',
        desc: 'Connect your Shopify or WooCommerce store.',
        action: 'Manage',
        href: '/dashboard/integrations',
    },
];

export default function Dashboard({ user }) {
    return (
        <AuthLayout user={user}>
            <div style={{ padding: '40px 40px' }}>
                <div style={{ marginBottom: 32 }}>
                    <Title level={3} style={{ fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px' }}>
                        Welcome back, {user.name}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                        Here's what's happening with your forms.
                    </Text>
                </div>
                <Row gutter={[20, 20]}>
                    {QUICK_LINKS.map((item) => (
                        <Col xs={24} sm={12} lg={6} key={item.title}>
                            <Card
                                style={{ borderRadius: 14, border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', height: '100%' }}
                                styles={{ body: { padding: '28px 24px' } }}
                            >
                                <div style={{ width: 42, height: 42, background: '#f97316', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                                    {item.icon}
                                </div>
                                <Title level={5} style={{ fontWeight: 700, color: '#111', marginBottom: 8 }}>
                                    {item.title}
                                </Title>
                                <Text style={{ color: '#888', fontSize: 13.5, lineHeight: 1.6, display: 'block', marginBottom: 20 }}>
                                    {item.desc}
                                </Text>
                                <Link href={item.href} style={{ fontWeight: 700, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#f97316' }}>
                                    {item.action} →
                                </Link>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        </AuthLayout>
    );
}
