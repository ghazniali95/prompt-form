import React, { useState } from 'react';
import { Button, Input, Typography, Alert } from 'antd';
import {
    GlobalOutlined, ArrowRightOutlined,
    LoadingOutlined, DoubleRightOutlined, RobotOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

export default function Onboarding({ user }) {
    const [url, setUrl]           = useState('');
    const [saving, setSaving]     = useState(false);
    const [skipping, setSkip]     = useState(false);
    const [error, setError]       = useState('');

    const handleContinue = async () => {
        const trimmed = url.trim();
        if (!trimmed) return;
        setError('');
        setSaving(true);
        try {
            const { data } = await axios.post('/api/v1/onboarding/complete', { website_url: trimmed });
            window.location.href = data.redirect;
        } catch (err) {
            setError(err.response?.data?.error ?? 'This link doesn’t look right. Please enter a valid website URL, e.g. mesh99.com.');
            setSaving(false);
        }
    };

    const handleSkip = async () => {
        setSkip(true);
        try {
            const { data } = await axios.post('/api/v1/onboarding/skip');
            window.location.href = data.redirect;
        } catch {
            setError('Something went wrong. Please try again.');
            setSkip(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', flexDirection: 'column' }}>
            {/* Top bar */}
            <div style={{ padding: '20px 40px', borderBottom: '1px solid #f0f0f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RobotOutlined style={{ color: '#fff', fontSize: 16 }} />
                    </div>
                    <Text strong style={{ fontSize: 16 }}>PromptForm</Text>
                </div>
                <Text type="secondary" style={{ fontSize: 13 }}>Welcome, {user.name}</Text>
            </div>

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 18, background: '#f97316',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                    }}>
                        <RobotOutlined style={{ fontSize: 30, color: '#fff' }} />
                    </div>

                    <Title level={2} style={{ fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
                        Set up your workspace
                    </Title>
                    <Text type="secondary" style={{ fontSize: 15, display: 'block', marginBottom: 36 }}>
                        Enter your website URL. We&rsquo;ll use it to match the look and feel of your AI-generated forms to your brand.
                    </Text>

                    {saving ? (
                        <div style={{ padding: '40px 0' }}>
                            <LoadingOutlined style={{ fontSize: 36, color: '#f97316' }} spin />
                            <div style={{ marginTop: 20, fontSize: 15, fontWeight: 500, color: '#555' }}>
                                Setting up your workspace&hellip;
                            </div>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <Alert type="error" message={error} showIcon style={{ marginBottom: 20, borderRadius: 10, textAlign: 'left' }} />
                            )}
                            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                                <Input
                                    size="large"
                                    prefix={<GlobalOutlined style={{ color: '#ccc' }} />}
                                    placeholder="yourwebsite.com or https://yourwebsite.com"
                                    value={url}
                                    onChange={e => setUrl(e.target.value)}
                                    onPressEnter={handleContinue}
                                    style={{ borderRadius: 10, flex: 1 }}
                                />
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<ArrowRightOutlined />}
                                    onClick={handleContinue}
                                    disabled={!url.trim()}
                                    style={{ borderRadius: 10, fontWeight: 700, background: '#f97316', borderColor: '#f97316' }}
                                >
                                    Continue
                                </Button>
                            </div>
                            <Button type="link" icon={<DoubleRightOutlined />} loading={skipping} onClick={handleSkip} style={{ color: '#aaa', fontSize: 13 }}>
                                Skip for now
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', padding: '16px 0', borderTop: '1px solid #f0f0f0', background: '#fff' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    You can change your website anytime from Settings.
                </Text>
            </div>
        </div>
    );
}
