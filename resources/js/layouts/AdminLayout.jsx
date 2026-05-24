import React from 'react';
import { router, usePage } from '@inertiajs/react';
import { ConfigProvider, Layout, Menu, Typography } from 'antd';
import { DashboardOutlined, ShopOutlined } from '@ant-design/icons';

const { Sider } = Layout;

const ADMIN_THEME = {
    token: {
        colorPrimary: '#6366f1',
        borderRadius: 8,
        fontFamily: "'Manrope', sans-serif",
    },
};

export default function AdminLayout({ children }) {
    const { url } = usePage();
    const isMerchant = url.startsWith('/admin/merchant/');
    const selectedKey = isMerchant ? 'merchants' : 'dashboard';

    return (
        <ConfigProvider theme={ADMIN_THEME}>
            <Layout style={{ minHeight: '100vh' }}>
                <Sider theme="dark" width={220}>
                    <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <Typography.Text strong style={{ color: '#fff', fontSize: 16 }}>
                            PromptForm
                        </Typography.Text>
                        <Typography.Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, display: 'block' }}>
                            Admin Panel
                        </Typography.Text>
                    </div>
                    <Menu
                        theme="dark"
                        mode="inline"
                        selectedKeys={[selectedKey]}
                        style={{ marginTop: 8 }}
                        onClick={({ key }) => {
                            if (key === 'dashboard') router.visit('/admin');
                        }}
                        items={[
                            { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
                            ...(isMerchant ? [{ key: 'merchants', icon: <ShopOutlined />, label: 'Merchant Account' }] : []),
                        ]}
                    />
                </Sider>
                <Layout>
                    {children}
                </Layout>
            </Layout>
        </ConfigProvider>
    );
}
