import React from 'react';
import { Layout, Typography, Card, Row, Col, Space, Tag } from 'antd';
import {
    ThunderboltOutlined,
    AppstoreOutlined,
    FileTextOutlined,
    BgColorsOutlined,
} from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text, Link } = Typography;

const FEATURES = [
    {
        icon: <ThunderboltOutlined style={{ fontSize: 22, color: '#6366f1' }} />,
        title: 'AI Form Generation',
        desc: 'Describe what you need in plain English and let AI build the form — fields, styles, and all.',
    },
    {
        icon: <AppstoreOutlined style={{ fontSize: 22, color: '#6366f1' }} />,
        title: 'One-Click Embed',
        desc: 'Publish your form and add it to any page using the Shopify Theme Editor. No code needed.',
    },
    {
        icon: <FileTextOutlined style={{ fontSize: 22, color: '#6366f1' }} />,
        title: 'Submission Tracking',
        desc: 'View all form submissions directly inside your Shopify admin. Export and manage responses.',
    },
    {
        icon: <BgColorsOutlined style={{ fontSize: 22, color: '#6366f1' }} />,
        title: 'Custom Styling',
        desc: 'Ask AI to match your brand colours, fonts, and layout — or refine any detail with a simple prompt.',
    },
];

export default function Landing() {
    return (
        <Layout style={{ minHeight: '100vh', background: '#f9fafb' }}>
            <Header style={{
                background: '#fff',
                borderBottom: '1px solid #e5e7eb',
                padding: '0 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: 60,
            }}>
                <Text style={{ fontSize: 20, fontWeight: 700, color: '#6366f1' }}>
                    PromptForm
                </Text>
                <Space size="large">
                    <Link href="/privacy-policy" style={{ color: '#6b7280', fontSize: 14 }}>Privacy Policy</Link>
                    <Link href="/terms" style={{ color: '#6b7280', fontSize: 14 }}>Terms of Service</Link>
                </Space>
            </Header>

            <Content style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px 60px' }}>

                {/* Badge */}
                <Tag
                    icon={<ShopOutlined />}
                    color="geekblue"
                    style={{ marginBottom: 28, padding: '4px 14px', fontSize: 13, borderRadius: 999 }}
                >
                    Shopify App
                </Tag>

                {/* Hero */}
                <Title style={{
                    fontSize: 'clamp(32px, 5vw, 52px)',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    textAlign: 'center',
                    maxWidth: 680,
                    lineHeight: 1.15,
                    marginBottom: 16,
                }}>
                    Build AI-Powered Forms for Your{' '}
                    <span style={{ color: '#6366f1' }}>Shopify</span> Store
                </Title>

                <Paragraph style={{
                    fontSize: 18,
                    color: '#6b7280',
                    textAlign: 'center',
                    maxWidth: 520,
                    lineHeight: 1.65,
                    marginBottom: 40,
                }}>
                    Describe the form you need in plain language. PromptForm uses AI to generate
                    beautiful, embeddable forms for your storefront in seconds — no coding required.
                </Paragraph>


                {/* Feature cards */}
                <Row gutter={[24, 24]} style={{ width: '100%', maxWidth: 900, marginBottom: 72 }}>
                    {FEATURES.map((f) => (
                        <Col xs={24} sm={12} lg={6} key={f.title}>
                            <Card
                                style={{ height: '100%', borderRadius: 12, border: '1px solid #e5e7eb' }}
                                styles={{ body: { padding: '28px 24px' } }}
                            >
                                <div style={{
                                    width: 40, height: 40,
                                    background: '#eef2ff',
                                    borderRadius: 10,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: 16,
                                }}>
                                    {f.icon}
                                </div>
                                <Title level={5} style={{ marginBottom: 8 }}>{f.title}</Title>
                                <Paragraph style={{ fontSize: 14, color: '#6b7280', marginBottom: 0 }}>
                                    {f.desc}
                                </Paragraph>
                            </Card>
                        </Col>
                    ))}
                </Row>


            </Content>

            <Footer style={{
                textAlign: 'center',
                fontSize: 13,
                color: '#9ca3af',
                borderTop: '1px solid #e5e7eb',
                background: '#fff',
                padding: '16px 24px',
            }}>
                © {new Date().getFullYear()} PromptForm &nbsp;·&nbsp;
                <Link href="/privacy-policy" style={{ color: '#9ca3af' }}>Privacy Policy</Link>
                &nbsp;·&nbsp;
                <Link href="/terms" style={{ color: '#9ca3af' }}>Terms of Service</Link>
            </Footer>
        </Layout>
    );
}
