import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { ConfigProvider, Layout, Menu, Tooltip, Typography } from 'antd';
import {
    DashboardOutlined, MenuFoldOutlined, MenuUnfoldOutlined, ShopOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;
const { Text } = Typography;

const SIDER_BG = '#14142a';
const ACCENT = '#6366f1';

const ADMIN_THEME = {
    token: {
        colorPrimary: ACCENT,
        borderRadius: 8,
        fontFamily: "'Manrope', sans-serif",
    },
    components: {
        Menu: {
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'transparent',
            darkItemColor: 'rgba(255,255,255,0.62)',
            darkItemHoverBg: 'rgba(255,255,255,0.06)',
            darkItemHoverColor: '#fff',
            darkItemSelectedBg: ACCENT,
            darkItemSelectedColor: '#fff',
            itemBorderRadius: 8,
            itemMarginInline: 12,
            itemMarginBlock: 4,
            itemHeight: 42,
            iconSize: 16,
        },
    },
};

function BrandMark({ collapsed }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: collapsed ? '20px 0' : '20px 20px',
            justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
            <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `linear-gradient(135deg, ${ACCENT} 0%, #8b5cf6 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: -0.5,
                boxShadow: '0 4px 14px rgba(99,102,241,0.45)',
            }}>
                PF
            </div>
            {!collapsed && (
                <div style={{ lineHeight: 1.25, overflow: 'hidden' }}>
                    <Text strong style={{ color: '#fff', fontSize: 15, display: 'block' }}>
                        PromptForm
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, display: 'block' }}>
                        Admin Panel
                    </Text>
                </div>
            )}
        </div>
    );
}

export default function AdminLayout({ children }) {
    const { url } = usePage();
    const [collapsed, setCollapsed] = useState(false);

    const isMerchant = url.startsWith('/admin/merchant/');
    const selectedKey = isMerchant ? 'merchants' : 'dashboard';
    const width = collapsed ? 80 : 240;

    const CollapseIcon = collapsed ? MenuUnfoldOutlined : MenuFoldOutlined;

    return (
        <ConfigProvider theme={ADMIN_THEME}>
            <Layout style={{ minHeight: '100vh' }}>
                <Sider
                    theme="dark"
                    width={240}
                    collapsed={collapsed}
                    collapsedWidth={80}
                    breakpoint="lg"
                    onBreakpoint={setCollapsed}
                    style={{
                        background: SIDER_BG,
                        borderRight: '1px solid rgba(255,255,255,0.07)',
                        position: 'fixed', insetInlineStart: 0, top: 0, bottom: 0,
                        overflow: 'auto',
                    }}
                >
                    {/* Ant wraps Sider children in its own div, so the column
                        flex context has to live on a wrapper we control. */}
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <BrandMark collapsed={collapsed} />

                    <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 16px 12px' }} />

                    {!collapsed && (
                        <Text style={{
                            color: 'rgba(255,255,255,0.32)', fontSize: 10, fontWeight: 700,
                            letterSpacing: 1.2, textTransform: 'uppercase',
                            padding: '0 24px', display: 'block', marginBottom: 6,
                        }}>
                            Overview
                        </Text>
                    )}

                    <Menu
                        theme="dark"
                        mode="inline"
                        selectedKeys={[selectedKey]}
                        style={{ background: 'transparent', borderInlineEnd: 'none' }}
                        onClick={({ key }) => {
                            if (key === 'dashboard') router.visit('/admin');
                        }}
                        items={[
                            { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
                            ...(isMerchant
                                ? [{ key: 'merchants', icon: <ShopOutlined />, label: 'Merchant Account' }]
                                : []),
                        ]}
                    />

                    <div style={{ marginTop: 'auto', padding: collapsed ? '12px 0' : '12px 12px' }}>
                        <Tooltip title={collapsed ? 'Expand' : 'Collapse'} placement="right">
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => setCollapsed((c) => !c)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setCollapsed((c) => !c); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    padding: collapsed ? '10px 0' : '10px 12px',
                                    borderRadius: 8, color: 'rgba(255,255,255,0.5)', fontSize: 13,
                                    transition: 'background 0.2s, color 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                    e.currentTarget.style.color = '#fff';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                                }}
                            >
                                <CollapseIcon />
                                {!collapsed && <span>Collapse</span>}
                            </div>
                        </Tooltip>
                    </div>
                    </div>
                </Sider>

                <Layout style={{
                    marginInlineStart: width,
                    transition: 'margin-inline-start 0.2s',
                    background: '#f5f6fa',
                }}>
                    {children}
                </Layout>
            </Layout>
        </ConfigProvider>
    );
}
