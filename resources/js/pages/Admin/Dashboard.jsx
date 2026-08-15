import React, { useEffect, useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import {
    Badge, Button, Card, Col, Empty, Input, Layout, Row, Space,
    Statistic, Table, Tag, Tooltip, Typography, message,
} from 'antd';
import {
    CheckCircleOutlined, CloseCircleOutlined, FileTextOutlined, FormOutlined,
    LoginOutlined, MessageOutlined, ReloadOutlined, SearchOutlined, ShopOutlined, UserOutlined,
} from '@ant-design/icons';
import AdminLayout from '@layouts/AdminLayout';

const { Text } = Typography;
const { Content } = Layout;
const BASE = '/api/admin';

async function apiFetch(path) {
    const res = await fetch(BASE + path, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
        // Surface the server's message so a failure is diagnosable from the UI.
        const detail = await res.text().catch(() => '');
        let message = `HTTP ${res.status}`;
        try {
            const parsed = JSON.parse(detail);
            if (parsed?.message) message += `: ${parsed.message}`;
        } catch { /* non-JSON error page — status alone is all we have */ }
        throw new Error(message);
    }
    return res.json();
}

function StatCard({ title, value, icon, color, loading }) {
    return (
        <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                    width: 52, height: 52, borderRadius: 12,
                    background: `${color}18`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, color,
                }}>
                    {icon}
                </div>
                <Statistic
                    title={<Text type="secondary" style={{ fontSize: 13 }}>{title}</Text>}
                    value={loading ? '-' : value}
                    styles={{ content: { fontSize: 28, fontWeight: 700, color: '#1a1a2e' } }}
                    loading={loading}
                />
            </div>
        </Card>
    );
}

function PlanTag({ plan }) {
    const map = {
        free:    { color: 'default', label: 'Free' },
        starter: { color: 'blue',    label: 'Starter' },
        growing: { color: 'purple',  label: 'Growing' },
    };
    const cfg = map[plan] ?? { color: 'default', label: plan ?? 'Free' };
    return <Tag color={cfg.color}>{cfg.label}</Tag>;
}

export default function Dashboard() {
    const [stats, setStats]               = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [merchants, setMerchants]       = useState([]);
    const [total, setTotal]               = useState(0);
    const [page, setPage]                 = useState(1);
    const [search, setSearch]             = useState('');
    const [searchInput, setSearchInput]   = useState('');
    const [tableLoading, setTableLoading] = useState(true);

    const [messageApi, contextHolder] = message.useMessage();

    const loadStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            setStats(await apiFetch('/stats'));
        } catch (e) {
            messageApi.error(`Failed to load stats — ${e.message}`);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    const loadMerchants = useCallback(async (pg = 1, q = '') => {
        setTableLoading(true);
        try {
            const params = new URLSearchParams({ page: pg, ...(q && { search: q }) });
            const data = await apiFetch(`/merchants?${params}`);
            setMerchants(data.data);
            setTotal(data.total);
        } catch (e) {
            messageApi.error(`Failed to load merchants — ${e.message}`);
            setMerchants([]);
            setTotal(0);
        } finally {
            setTableLoading(false);
        }
    }, []);

    useEffect(() => { loadStats(); }, [loadStats]);
    useEffect(() => { loadMerchants(page, search); }, [loadMerchants, page, search]);

    const handleSearch = () => { setSearch(searchInput); setPage(1); };

    const columns = [
        {
            title: 'Merchant',
            dataIndex: 'name',
            key: 'name',
            render: (name, record) => (
                <Space>
                    <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: '#6366f118', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: '#6366f1', fontSize: 16, flexShrink: 0,
                    }}>
                        <ShopOutlined />
                    </div>
                    <div>
                        <Text strong style={{ display: 'block', fontSize: 13 }}>{name}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{record.email}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Plan',
            dataIndex: 'plan',
            key: 'plan',
            width: 90,
            render: (plan) => <PlanTag plan={plan} />,
        },
        {
            title: 'Store',
            key: 'store',
            width: 200,
            render: (_, record) => {
                if (!record.store_name) {
                    return <Text type="secondary" style={{ fontSize: 12 }}>Not connected</Text>;
                }
                return (
                    <Space size={4}>
                        <Tag icon={record.is_connected ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                             color={record.is_connected ? 'success' : 'default'}>
                            {record.is_connected ? 'Connected' : 'Disconnected'}
                        </Tag>
                        <Tooltip title={record.store_name}>
                            <Text style={{ fontSize: 11 }} ellipsis>{record.store_name}</Text>
                        </Tooltip>
                    </Space>
                );
            },
        },
        {
            title: 'Subscription',
            key: 'subscription_status',
            width: 110,
            render: (_, record) => {
                const status = record.subscription_status;
                if (!status) return <Text type="secondary" style={{ fontSize: 12 }}>None</Text>;
                return (
                    <Tag color={status === 'active' ? 'success' : 'warning'}>{status}</Tag>
                );
            },
        },
        {
            title: 'Forms',
            dataIndex: 'forms_count',
            key: 'forms_count',
            width: 80,
            align: 'center',
            render: (count) => (
                <Badge count={count} showZero style={{ backgroundColor: count ? '#6366f1' : '#d9d9d9' }} />
            ),
        },
        {
            title: 'Responses',
            dataIndex: 'form_responses_count',
            key: 'form_responses_count',
            width: 100,
            align: 'center',
            render: (count) => (
                <Badge count={count} showZero style={{ backgroundColor: count ? '#10b981' : '#d9d9d9' }} />
            ),
        },
        {
            title: 'Signed Up',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 120,
            render: (date) => (
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {date ? new Date(date).toLocaleDateString() : '-'}
                </Text>
            ),
        },
        {
            title: '',
            key: 'action',
            width: 110,
            render: (_, record) => (
                <Button
                    type="primary"
                    size="small"
                    icon={<LoginOutlined />}
                    onClick={() => router.visit(`/admin/merchant/${record.id}`)}
                    style={{ borderRadius: 6 }}
                >
                    View
                </Button>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Content style={{ padding: 28, background: '#f5f6fa', minHeight: '100vh' }}>
                {contextHolder}

                <div style={{ marginBottom: 24 }}>
                    <Typography.Title level={3} style={{ margin: 0, color: '#1a1a2e', fontWeight: 700 }}>
                        Dashboard
                    </Typography.Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        Every merchant using PromptForm, at a glance.
                    </Text>
                </div>

                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard title={`Merchants (${stats?.connected_merchants ?? 0} connected)`} value={stats?.total_merchants} icon={<UserOutlined />} color="#6366f1" loading={statsLoading} />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard title="Paying Merchants" value={stats?.paying_merchants} icon={<FileTextOutlined />} color="#10b981" loading={statsLoading} />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard title={`Forms (${stats?.published_forms ?? 0} published)`} value={stats?.total_forms} icon={<FormOutlined />} color="#f59e0b" loading={statsLoading} />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard title="Total Responses" value={stats?.total_responses} icon={<MessageOutlined />} color="#3b82f6" loading={statsLoading} />
                    </Col>
                </Row>

                <Card
                    style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                    title={
                        <Space>
                            <ShopOutlined style={{ color: '#6366f1' }} />
                            <span style={{ fontWeight: 600 }}>Merchants</span>
                            <Tag color="purple">{total}</Tag>
                        </Space>
                    }
                    extra={
                        <Space>
                            <Input
                                placeholder="Search by name or email…"
                                prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onPressEnter={handleSearch}
                                style={{ width: 240, borderRadius: 8 }}
                                allowClear
                                onClear={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                            />
                            <Button icon={<SearchOutlined />} type="primary" onClick={handleSearch} style={{ borderRadius: 8 }}>
                                Search
                            </Button>
                            <Tooltip title="Refresh">
                                <Button icon={<ReloadOutlined />} onClick={() => { loadStats(); loadMerchants(page, search); }} style={{ borderRadius: 8 }} />
                            </Tooltip>
                        </Space>
                    }
                >
                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={merchants}
                        loading={tableLoading}
                        pagination={{
                            current: page,
                            pageSize: 20,
                            total,
                            onChange: (p) => setPage(p),
                            showSizeChanger: false,
                            showTotal: (t) => `${t} merchants`,
                        }}
                        locale={{ emptyText: <Empty description="No merchants yet" /> }}
                        scroll={{ x: 1100 }}
                    />
                </Card>
            </Content>
        </AdminLayout>
    );
}
