import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Badge,
    Button,
    Card,
    Col,
    Descriptions,
    Empty,
    Layout,
    Row,
    Space,
    Spin,
    Table,
    Tag,
    Typography,
    message,
} from 'antd';
import {
    ArrowLeftOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    FormOutlined,
    LogoutOutlined,
    SettingOutlined,
    ShopOutlined,
} from '@ant-design/icons';

const { Header, Content } = Layout;
const { Text, Title } = Typography;
const BASE = '/api/admin';

async function apiFetch(path) {
    const res = await fetch(BASE + path, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

function PlanTag({ plan }) {
    const map = {
        free:  { color: 'default', label: 'Free' },
        basic: { color: 'blue',    label: 'Basic' },
        pro:   { color: 'purple',  label: 'Pro' },
    };
    const cfg = map[plan] ?? { color: 'default', label: plan ?? 'Free' };
    return <Tag color={cfg.color}>{cfg.label}</Tag>;
}

function FieldList({ schema }) {
    const fields = schema?.fields ?? [];
    if (!fields.length) return <Text type="secondary">No fields</Text>;
    return (
        <Space wrap size={4}>
            {fields.map((f, i) => (
                <Tag key={i} style={{ fontSize: 11, margin: 0 }}>
                    {f.label ?? f.name ?? f.type}
                </Tag>
            ))}
        </Space>
    );
}

function JsonBlock({ data }) {
    if (!data || !Object.keys(data).length) return <Text type="secondary">—</Text>;
    return (
        <pre style={{
            fontSize: 11, background: '#f6f8fa', borderRadius: 6,
            padding: '10px 12px', margin: 0, maxHeight: 200,
            overflow: 'auto', border: '1px solid #e8eaed',
        }}>
            {JSON.stringify(data, null, 2)}
        </pre>
    );
}

export default function MerchantAccount() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [messageApi, contextHolder] = message.useMessage();

    const [loading, setLoading]           = useState(true);
    const [merchant, setMerchant]         = useState(null);
    const [forms, setForms]               = useState([]);
    const [selectedForm, setSelectedForm] = useState(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const data = await apiFetch(`/merchants/${id}`);
                setMerchant(data.merchant);
                setForms(data.forms);
                if (data.forms.length > 0) setSelectedForm(data.forms[0]);
            } catch {
                messageApi.error('Failed to load merchant account');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) {
        return (
            <Layout style={{ minHeight: '100vh', background: '#f5f6fa' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <Spin size="large" tip="Loading account…" />
                </div>
            </Layout>
        );
    }

    if (!merchant) return null;

    const active = merchant.subscription_status === 'active';

    const formColumns = [
        {
            title: 'Form Name',
            dataIndex: 'title',
            key: 'title',
            render: (title, record) => (
                <Space>
                    <FormOutlined style={{ color: '#6366f1' }} />
                    <div>
                        <Text
                            strong
                            style={{ display: 'block', fontSize: 13, cursor: 'pointer', color: '#6366f1' }}
                            onClick={() => setSelectedForm(record)}
                        >
                            {title || 'Untitled'}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 10, fontFamily: 'monospace' }}>
                            {record.ulid}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'is_published',
            key: 'is_published',
            width: 100,
            render: (pub) => (
                <Tag color={pub ? 'success' : 'default'}>{pub ? 'Published' : 'Draft'}</Tag>
            ),
        },
        {
            title: 'Responses',
            dataIndex: 'responses_count',
            key: 'responses_count',
            width: 100,
            align: 'center',
            render: (count) => (
                <Badge count={count} showZero
                    style={{ backgroundColor: count ? '#10b981' : '#d9d9d9' }} />
            ),
        },
        {
            title: 'Created',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 110,
            render: (d) => <Text type="secondary" style={{ fontSize: 12 }}>{d ? new Date(d).toLocaleDateString() : '-'}</Text>,
        },
        {
            title: '',
            key: 'view',
            width: 80,
            render: (_, record) => (
                <Button size="small" onClick={() => setSelectedForm(record)} style={{ borderRadius: 6 }}>
                    View
                </Button>
            ),
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh', background: '#f5f6fa' }}>
            {contextHolder}

            {/* Impersonation bar */}
            <div style={{
                background: '#1a1a2e', color: '#fff', padding: '8px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: 13,
            }}>
                <Space>
                    <ShopOutlined />
                    <Text style={{ color: '#a5b4fc', fontWeight: 600 }}>Viewing as:</Text>
                    <Text style={{ color: '#fff' }}>{merchant.name}</Text>
                    <Tag color="purple" style={{ marginLeft: 4 }}>{merchant.email}</Tag>
                </Space>
                <Button
                    size="small"
                    icon={<LogoutOutlined />}
                    onClick={() => navigate('/admin')}
                    style={{ borderRadius: 6, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff' }}
                >
                    Exit Account
                </Button>
            </div>

            <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Space>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/admin')}
                        style={{ borderRadius: 8 }}
                    >
                        Back
                    </Button>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#6366f118', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontSize: 18 }}>
                        <ShopOutlined />
                    </div>
                    <div>
                        <Title level={4} style={{ margin: 0, color: '#1a1a2e' }}>{merchant.name}</Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>{merchant.email}</Text>
                    </div>
                </Space>
                <Space>
                    <PlanTag plan={merchant.plan} />
                    <Tag icon={active ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={active ? 'success' : 'default'}>
                        {active ? 'Active' : merchant.subscription_status ?? 'None'}
                    </Tag>
                </Space>
            </Header>

            <Content style={{ padding: 24 }}>
                {/* Account summary */}
                <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                    <Col xs={24} md={12}>
                        <Card
                            title={<Space><ShopOutlined style={{ color: '#6366f1' }} /><span>Account Info</span></Space>}
                            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}
                            size="small"
                        >
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Shop Domain">
                                    <Text strong>{merchant.name}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Email">{merchant.email}</Descriptions.Item>
                                <Descriptions.Item label="Plan"><PlanTag plan={merchant.plan} /></Descriptions.Item>
                                <Descriptions.Item label="Subscription">
                                    <Tag color={active ? 'success' : 'default'}>
                                        {merchant.subscription_status ?? 'None'}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Installed">
                                    {merchant.created_at ? new Date(merchant.created_at).toLocaleString() : '-'}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card
                            title={<Space><SettingOutlined style={{ color: '#f59e0b' }} /><span>Usage</span></Space>}
                            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}
                            size="small"
                        >
                            <Row gutter={16}>
                                <Col span={12}>
                                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                        <div style={{ fontSize: 36, fontWeight: 700, color: '#6366f1' }}>{merchant.forms_count}</div>
                                        <Text type="secondary">Total Forms</Text>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                        <div style={{ fontSize: 36, fontWeight: 700, color: '#10b981' }}>{merchant.form_responses_count}</div>
                                        <Text type="secondary">Total Responses</Text>
                                    </div>
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                </Row>

                {/* Forms + Detail */}
                <Row gutter={[16, 16]}>
                    {/* Forms list */}
                    <Col xs={24} lg={selectedForm ? 12 : 24}>
                        <Card
                            title={
                                <Space>
                                    <FormOutlined style={{ color: '#6366f1' }} />
                                    <span style={{ fontWeight: 600 }}>Forms</span>
                                    <Tag color="purple">{forms.length}</Tag>
                                </Space>
                            }
                            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                        >
                            {forms.length === 0 ? (
                                <Empty description="This merchant has no forms yet" />
                            ) : (
                                <Table
                                    rowKey="id"
                                    columns={formColumns}
                                    dataSource={forms}
                                    pagination={false}
                                    size="small"
                                    rowClassName={(record) =>
                                        selectedForm?.id === record.id ? 'ant-table-row-selected' : ''
                                    }
                                    scroll={{ x: 500 }}
                                />
                            )}
                        </Card>
                    </Col>

                    {/* Form detail */}
                    {selectedForm && (
                        <Col xs={24} lg={12}>
                            <Card
                                title={
                                    <Space>
                                        <FormOutlined style={{ color: '#6366f1' }} />
                                        <span style={{ fontWeight: 600 }}>{selectedForm.title || 'Untitled Form'}</span>
                                        <Tag color={selectedForm.is_published ? 'success' : 'default'}>
                                            {selectedForm.is_published ? 'Published' : 'Draft'}
                                        </Tag>
                                    </Space>
                                }
                                extra={
                                    <Button size="small" type="text" onClick={() => setSelectedForm(null)}>✕</Button>
                                }
                                style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                            >
                                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Form ID</Text>
                                        <div>
                                            <Text code style={{ fontSize: 11 }}>{selectedForm.ulid}</Text>
                                        </div>
                                    </div>

                                    <div>
                                        <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Fields</Text>
                                        <div style={{ marginTop: 6 }}>
                                            <FieldList schema={selectedForm.schema} />
                                        </div>
                                    </div>

                                    <div>
                                        <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Settings</Text>
                                        <div style={{ marginTop: 6 }}>
                                            <JsonBlock data={selectedForm.settings} />
                                        </div>
                                    </div>

                                    <div>
                                        <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Styles</Text>
                                        <div style={{ marginTop: 6 }}>
                                            <JsonBlock data={selectedForm.styles} />
                                        </div>
                                    </div>

                                    <div>
                                        <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Created</Text>
                                        <div>
                                            <Text style={{ fontSize: 13 }}>
                                                {selectedForm.created_at ? new Date(selectedForm.created_at).toLocaleString() : '-'}
                                            </Text>
                                        </div>
                                    </div>
                                </Space>
                            </Card>
                        </Col>
                    )}
                </Row>
            </Content>
        </Layout>
    );
}
