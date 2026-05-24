import React, { useState } from 'react';
import {
    Button, Card, Tag, Typography, Modal,
    Form, Input, message,
} from 'antd';
import {
    ShopOutlined, DisconnectOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import AuthLayout from '@layouts/AuthLayout';

const { Title, Text } = Typography;

function ShopifyCard({ integration, onConnect, onDisconnect, disconnecting }) {
    const connected = integration?.status === true;

    return (
        <Card
            style={{
                borderRadius: 14,
                border: connected ? '1.5px solid #95bf47' : '1px solid #f0f0f0',
                boxShadow: connected ? '0 2px 12px rgba(149,191,71,0.10)' : '0 2px 8px rgba(0,0,0,0.04)',
                maxWidth: 480,
            }}
            styles={{ body: { padding: '24px' } }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 10,
                        background: '#95bf4718',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <ShopOutlined style={{ fontSize: 22, color: '#95bf47' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <Text strong style={{ fontSize: 15 }}>Shopify</Text>
                            {connected
                                ? <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: 11, borderRadius: 4, margin: 0 }}>Connected</Tag>
                                : <Tag color="default" style={{ fontSize: 11, borderRadius: 4, margin: 0 }}>Not connected</Tag>
                            }
                        </div>
                        <Tag style={{ fontSize: 11, borderRadius: 4, marginTop: 4, background: '#f8f8f8', border: '1px solid #f0f0f0' }}>
                            E-commerce
                        </Tag>
                    </div>
                </div>

                {connected ? (
                    <div style={{ background: '#f6ffed', borderRadius: 8, padding: '10px 14px', border: '1px solid #b7eb8f' }}>
                        <Text style={{ fontSize: 13, fontWeight: 600, color: '#389e0d', display: 'block' }}>
                            {integration.shop_domain}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Connected {integration.connected_at ?? ''}
                        </Text>
                    </div>
                ) : (
                    <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
                        Connect your Shopify store to embed forms directly in your storefront using the PromptForm theme app extension.
                    </Text>
                )}

                <div style={{ paddingTop: 8, display: 'flex', gap: 8 }}>
                    {connected ? (
                        <>
                            <Button block onClick={onConnect} style={{ fontWeight: 600 }}>
                                Reinstall
                            </Button>
                            <Button
                                danger block
                                icon={<DisconnectOutlined />}
                                loading={disconnecting}
                                onClick={onDisconnect}
                                style={{ fontWeight: 600 }}
                            >
                                Disconnect
                            </Button>
                        </>
                    ) : (
                        <Button
                            type="primary" block
                            icon={<ShopOutlined />}
                            onClick={() => window.open('https://apps.shopify.com/promptform', '_blank')}
                            style={{ fontWeight: 700, background: '#95bf47', borderColor: '#95bf47' }}
                        >
                            Install App from Shopify
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}

function ShopifyConnectModal({ open, onClose }) {
    const [form] = Form.useForm();

    const handleConnect = async () => {
        try {
            const { shop } = await form.validateFields();
            const domain = shop.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
            window.location.href = `/auth/shopify/begin?shop=${encodeURIComponent(domain)}`;
        } catch {}
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#95bf4718', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShopOutlined style={{ color: '#95bf47', fontSize: 18 }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>Connect Shopify Store</div>
                        <div style={{ fontSize: 12, color: '#999', fontWeight: 400 }}>Enter your Shopify store domain</div>
                    </div>
                </div>
            }
            footer={[
                <Button key="cancel" onClick={onClose}>Cancel</Button>,
                <Button key="connect" type="primary" onClick={handleConnect} style={{ fontWeight: 700, background: '#95bf47', borderColor: '#95bf47' }}>
                    Connect Store
                </Button>,
            ]}
            width={460}
            destroyOnHidden
        >
            <div style={{ padding: '16px 0' }}>
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Shopify Store Domain"
                        name="shop"
                        rules={[
                            { required: true, message: 'Please enter your store domain.' },
                            {
                                pattern: /^(https?:\/\/)?[a-zA-Z0-9-]+\.myshopify\.com\/?$/,
                                message: 'Please enter a valid .myshopify.com domain.',
                            },
                        ]}
                    >
                        <Input
                            size="large"
                            placeholder="yourstore.myshopify.com"
                            style={{ borderRadius: 8 }}
                            addonBefore="https://"
                        />
                    </Form.Item>
                </Form>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    You'll be redirected to Shopify to authorise the PromptForm app on your store.
                </Text>
            </div>
        </Modal>
    );
}

export default function Integrations({ user, shopify_integration }) {
    const [shopifyModalOpen, setShopifyModal] = useState(false);
    const [shopify, setShopify]               = useState(shopify_integration);
    const [disconnecting, setDisconnecting]   = useState(false);

    const handleDisconnectShopify = () => {
        Modal.confirm({
            title: 'Disconnect Shopify?',
            content: 'Your forms will no longer be available on your Shopify storefront.',
            okText: 'Disconnect',
            okType: 'danger',
            onOk: async () => {
                setDisconnecting(true);
                try {
                    await axios.delete('/api/v1/integrations/shopify');
                    setShopify(prev => prev ? { ...prev, status: false } : null);
                    message.success('Shopify store disconnected.');
                } catch {
                    message.error('Failed to disconnect. Please try again.');
                } finally {
                    setDisconnecting(false);
                }
            },
        });
    };

    return (
        <AuthLayout user={user}>
            <div style={{ padding: '40px' }}>
                <div style={{ marginBottom: 28 }}>
                    <Title level={3} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>
                        Integrations
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        Connect your forms with your Shopify store.
                    </Text>
                </div>

                <ShopifyCard
                    integration={shopify}
                    onConnect={() => setShopifyModal(true)}
                    onDisconnect={handleDisconnectShopify}
                    disconnecting={disconnecting}
                />
            </div>

            <ShopifyConnectModal open={shopifyModalOpen} onClose={() => setShopifyModal(false)} />
        </AuthLayout>
    );
}
