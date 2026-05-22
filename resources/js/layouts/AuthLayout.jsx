import React, { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Layout, Menu, Typography, Divider, Progress, Avatar, Dropdown, Button, theme, message } from 'antd';
import {
    HomeOutlined, FileTextOutlined, AppstoreOutlined, BarChartOutlined,
    ApiOutlined, CreditCardOutlined, QuestionCircleOutlined,
    UserOutlined, LogoutOutlined, UpOutlined, DownOutlined, CrownOutlined, PlusOutlined,
    InboxOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Sider, Content } = Layout;
const { Text } = Typography;
const { useToken } = theme;

const NAV_ITEMS = [
    { key: '/dashboard',              icon: <HomeOutlined />,           label: 'Dashboard' },
    { key: '/forms',                  icon: <FileTextOutlined />,       label: 'Forms' },
    { key: '/submissions',            icon: <InboxOutlined />,          label: 'Submissions' },
    { key: '/dashboard/templates',    icon: <AppstoreOutlined />,       label: 'Templates' },
    { key: '/dashboard/analytics',    icon: <BarChartOutlined />,       label: 'Analytics' },
    { key: '/dashboard/integrations', icon: <ApiOutlined />,            label: 'Integrations' },
    { key: '/dashboard/pricing',      icon: <CreditCardOutlined />,     label: 'Pricing' },
    { key: '/dashboard/support',      icon: <QuestionCircleOutlined />, label: 'Support' },
];

export default function AuthLayout({ user, children }) {
    const { token } = useToken();
    const page = usePage();
    const url = page.url;
    const { flash } = page.props;
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        if (flash?.success) message.success(flash.success);
        if (flash?.error)   message.error(flash.error);
    }, [flash?.success, flash?.error]);

    const activeKey = NAV_ITEMS.find(item =>
        item.key === '/dashboard' ? url === '/dashboard' : url.startsWith(item.key)
    )?.key ?? '';

    const handleLogout = async () => {
        try {
            const { data } = await axios.post('/auth/logout');
            router.visit(data.redirect);
        } catch {
            router.visit('/login');
        }
    };

    const aiUsed    = user?.ai_used    ?? 0;
    const aiLimit   = user?.ai_limit   ?? 10;
    const aiPercent = aiLimit > 0 ? Math.round((aiUsed / aiLimit) * 100) : 0;
    const initials  = user?.name?.[0]?.toUpperCase() ?? '?';
    const plan      = user?.plan ?? 'Free';

    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: <span onClick={() => router.visit('/dashboard/profile')}>Profile</span>,
        },
        { type: 'divider' },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: <span onClick={handleLogout}>Log Out</span>,
            danger: true,
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                width={220}
                style={{
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0, top: 0, bottom: 0,
                    zIndex: 50,
                    borderRight: `1px solid ${token.colorBorderSecondary}`,
                    background: token.colorBgContainer,
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

                    {/* Logo */}
                    <div style={{ padding: '32px 24px 20px' }}>
                        <img src="/images/logo.png" alt="PromptForm" style={{ height: 28, width: 'auto' }} />
                    </div>

                    {/* Create Form */}
                    <div style={{ padding: '0 16px 8px' }}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            block
                            onClick={() => router.visit('/forms')}
                            style={{ fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                        >
                            Create Form
                        </Button>
                    </div>

                    {/* Primary nav */}
                    <Menu
                        mode="inline"
                        selectedKeys={[activeKey]}
                        onClick={({ key }) => router.visit(key)}
                        style={{ borderRight: 'none', background: 'transparent', flex: 1 }}
                        items={NAV_ITEMS.map(item => ({
                            key: item.key,
                            icon: item.icon,
                            label: (
                                <Text style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em', fontSize: 13 }}>
                                    {item.label}
                                </Text>
                            ),
                        }))}
                    />

                    {/* AI usage */}
                    <div style={{ padding: '0 20px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>AI Generations</Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>{aiUsed} / {aiLimit}</Text>
                        </div>
                        <Progress
                            percent={aiPercent}
                            size="small"
                            showInfo={false}
                            strokeColor={aiPercent >= 90 ? '#f5222d' : aiPercent >= 70 ? '#faad14' : '#f97316'}
                            trailColor={token.colorBorderSecondary}
                        />
                    </div>

                    {/* Upgrade button */}
                    {plan === 'Free' && (
                        <div style={{ padding: '0 16px 10px' }}>
                            <Button
                                type="primary"
                                icon={<CrownOutlined />}
                                block
                                onClick={() => router.visit('/dashboard/pricing')}
                                style={{ fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                            >
                                Upgrade Plan
                            </Button>
                        </div>
                    )}

                    <Divider style={{ margin: '0 0 4px' }} />

                    {/* User dropdown */}
                    <Dropdown
                        menu={{ items: userMenuItems }}
                        trigger={['click']}
                        placement="topLeft"
                        onOpenChange={setDropdownOpen}
                    >
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 16px 16px', cursor: 'pointer',
                        }}>
                            <Avatar size={32} style={{ background: '#f97316', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                                {initials}
                            </Avatar>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontSize: 13, fontWeight: 600, display: 'block' }} ellipsis>
                                    {user?.name}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 11, display: 'block' }} ellipsis>
                                    {user?.email}
                                </Text>
                            </div>
                            {dropdownOpen ? <UpOutlined style={{ fontSize: 10, color: '#bbb', flexShrink: 0 }} /> : <DownOutlined style={{ fontSize: 10, color: '#bbb', flexShrink: 0 }} />}
                        </div>
                    </Dropdown>
                </div>
            </Sider>

            <Layout style={{ marginLeft: 220, background: token.colorBgLayout, minHeight: '100vh' }}>
                <Content>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
