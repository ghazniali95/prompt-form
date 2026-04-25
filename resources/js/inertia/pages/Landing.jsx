import React from 'react';
import { Layout, Typography, Card, Row, Col, Space } from 'antd';
import {
    ThunderboltOutlined,
    AppstoreOutlined,
    FileTextOutlined,
    BgColorsOutlined,
} from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Link } = Typography;

const FEATURES = [
    {
        icon: <ThunderboltOutlined style={{ fontSize: 20, color: '#fff' }} />,
        title: 'AI Form Generation',
        desc: 'Describe what you need in plain English and let AI build the form — fields, styles, and all.',
    },
    {
        icon: <AppstoreOutlined style={{ fontSize: 20, color: '#fff' }} />,
        title: 'One-Click Embed',
        desc: 'Publish your form and add it to any page using the Shopify Theme Editor. No code needed.',
    },
    {
        icon: <FileTextOutlined style={{ fontSize: 20, color: '#fff' }} />,
        title: 'Submission Tracking',
        desc: 'View all form submissions directly inside your Shopify admin. Export and manage responses.',
    },
    {
        icon: <BgColorsOutlined style={{ fontSize: 20, color: '#fff' }} />,
        title: 'Custom Styling',
        desc: 'Ask AI to match your brand colours, fonts, and layout — or refine any detail with a simple prompt.',
    },
];

export default function Landing() {
    return (
        <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>

            {/* Header */}
            <Header style={{
                background: '#fff',
                borderBottom: '1px solid #e8e8e8',
                padding: '0 40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: 64,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
                <img src="/images/logo.png" alt="PromptForm" style={{ height: 34 }} />
                <Space size={32}>
                    <Link href="/privacy-policy" style={{ color: '#666', fontSize: 14, fontWeight: 500 }}>Privacy Policy</Link>
                    <Link href="/terms" style={{ color: '#666', fontSize: 14, fontWeight: 500 }}>Terms of Service</Link>
                </Space>
            </Header>

            <Content style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                {/* Hero section */}
                <div style={{
                    width: '100%',
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '90px 24px 80px',
                    borderBottom: '1px solid #e8e8e8',
                }}>
                    <span style={{
                        display: 'inline-block',
                        marginBottom: 24,
                        padding: '5px 16px',
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        background: '#f0f0f0',
                        color: '#555',
                        borderRadius: 999,
                        border: '1px solid #ddd',
                    }}>
                        Shopify App
                    </span>

                    <Title style={{
                        fontSize: 'clamp(30px, 5vw, 50px)',
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        textAlign: 'center',
                        maxWidth: 660,
                        lineHeight: 1.15,
                        marginBottom: 20,
                        color: '#111',
                    }}>
                        Build AI-Powered Forms<br />for Your Shopify Store
                    </Title>

                    <Paragraph style={{
                        fontSize: 17,
                        color: '#777',
                        textAlign: 'center',
                        maxWidth: 500,
                        lineHeight: 1.7,
                        marginBottom: 0,
                    }}>
                        Describe the form you need in plain language. PromptForm uses AI to generate
                        beautiful, embeddable forms for your storefront in seconds — no coding required.
                    </Paragraph>
                </div>

                {/* Feature cards */}
                <div style={{ width: '100%', maxWidth: 960, padding: '64px 24px' }}>
                    <Title level={3} style={{
                        textAlign: 'center',
                        color: '#111',
                        fontWeight: 700,
                        marginBottom: 40,
                        letterSpacing: '-0.02em',
                    }}>
                        Everything you need
                    </Title>
                    <Row gutter={[20, 20]}>
                        {FEATURES.map((f) => (
                            <Col xs={24} sm={12} lg={6} key={f.title}>
                                <Card
                                    style={{
                                        height: '100%',
                                        borderRadius: 14,
                                        background: '#fff',
                                        border: '1px solid #e8e8e8',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                    }}
                                    styles={{ body: { padding: '28px 22px' } }}
                                >
                                    <div style={{
                                        width: 42, height: 42,
                                        background: '#1a1a1a',
                                        borderRadius: 10,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: 18,
                                    }}>
                                        {f.icon}
                                    </div>
                                    <Title level={5} style={{ marginBottom: 8, color: '#111', fontWeight: 700 }}>
                                        {f.title}
                                    </Title>
                                    <Paragraph style={{ fontSize: 13.5, color: '#888', marginBottom: 0, lineHeight: 1.6 }}>
                                        {f.desc}
                                    </Paragraph>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>

            </Content>

            <Footer style={{
                textAlign: 'center',
                fontSize: 13,
                color: '#aaa',
                borderTop: '1px solid #e8e8e8',
                background: '#fff',
                padding: '20px 24px',
            }}>
                © {new Date().getFullYear()} PromptForm &nbsp;·&nbsp;
                <Link href="/privacy-policy" style={{ color: '#aaa' }}>Privacy Policy</Link>
                &nbsp;·&nbsp;
                <Link href="/terms" style={{ color: '#aaa' }}>Terms of Service</Link>
            </Footer>
        </Layout>
    );
}
