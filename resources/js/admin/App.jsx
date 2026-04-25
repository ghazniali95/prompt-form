import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ConfigProvider, Layout, Menu, Typography } from 'antd';
import { DashboardOutlined, ShopOutlined } from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import MerchantAccount from './pages/MerchantAccount';

const { Sider, Layout: InnerLayout, Header, Content } = Layout;

function AdminLayout() {
    const navigate   = useNavigate();
    const location   = useLocation();
    const isMerchant = location.pathname.startsWith('/admin/merchant/');

    const selectedKey = isMerchant ? 'merchants' : 'dashboard';

    return (
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
                        if (key === 'dashboard') navigate('/admin');
                    }}
                    items={[
                        {
                            key: 'dashboard',
                            icon: <DashboardOutlined />,
                            label: 'Dashboard',
                        },
                        ...(isMerchant ? [{
                            key: 'merchants',
                            icon: <ShopOutlined />,
                            label: 'Merchant Account',
                        }] : []),
                    ]}
                />
            </Sider>

            <Layout>
                <Routes>
                    <Route path="/admin" element={<Dashboard />} />
                    <Route path="/admin/merchant/:id" element={<MerchantAccount />} />
                </Routes>
            </Layout>
        </Layout>
    );
}

export default function App() {
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#6366f1',
                    borderRadius: 8,
                },
            }}
        >
            <BrowserRouter>
                <AdminLayout />
            </BrowserRouter>
        </ConfigProvider>
    );
}
