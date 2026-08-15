import React, { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Badge, Button, Card, Col, Descriptions, Empty, Layout, Row, Space,
    Spin, Table, Tag, Typography, message,
} from 'antd';
import {
    ApiOutlined, ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined,
    CreditCardOutlined, EyeOutlined, FormOutlined, SettingOutlined, ShopOutlined,
} from '@ant-design/icons';
import AdminLayout from '@layouts/AdminLayout';

const { Content } = Layout;
const { Text, Title } = Typography;
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

function PlanTag({ plan }) {
    const map = {
        free:    { color: 'default', label: 'Free' },
        starter: { color: 'blue',    label: 'Starter' },
        growing: { color: 'purple',  label: 'Growing' },
    };
    const cfg = map[plan] ?? { color: 'default', label: plan ?? 'Free' };
    return <Tag color={cfg.color}>{cfg.label}</Tag>;
}

function CodeBlock({ code, empty = '—' }) {
    if (!code) return <Text type="secondary">{empty}</Text>;
    return (
        <pre style={{
            fontSize: 11, background: '#f6f8fa', borderRadius: 6,
            padding: '10px 12px', margin: 0, maxHeight: 320,
            overflow: 'auto', border: '1px solid #e8eaed',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
            {code}
        </pre>
    );
}

function fmtDate(d, withTime = false) {
    if (!d) return '-';
    const date = new Date(d);
    return withTime ? date.toLocaleString() : date.toLocaleDateString();
}

export default function MerchantAccount() {
    const { merchantId } = usePage().props;
    const [messageApi, contextHolder] = message.useMessage();

    const [loading, setLoading]           = useState(true);
    const [merchant, setMerchant]         = useState(null);
    const [forms, setForms]               = useState([]);
    const [selectedForm, setSelectedForm] = useState(null);
    const [source, setSource]             = useState(null);
    const [sourceLoading, setSourceLoading] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const data = await apiFetch(`/merchants/${merchantId}`);
                setMerchant(data.merchant);
                setForms(data.forms);
                if (data.forms.length > 0) setSelectedForm(data.forms[0]);
            } catch (e) {
                messageApi.error(`Failed to load merchant account — ${e.message}`);
            } finally {
                setLoading(false);
            }
        })();
    }, [merchantId]);

    // Form source is fetched on demand — it is too large to inline in the list.
    useEffect(() => {
        if (!selectedForm) { setSource(null); return; }

        let cancelled = false;
        (async () => {
            setSourceLoading(true);
            setSource(null);
            try {
                const data = await apiFetch(`/forms/${selectedForm.ulid}`);
                if (!cancelled) setSource(data);
            } catch (e) {
                if (!cancelled) messageApi.error(`Failed to load form source — ${e.message}`);
            } finally {
                if (!cancelled) setSourceLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [selectedForm?.ulid]);

    if (loading) {
        return (
            <AdminLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <Spin size="large" />
                </div>
            </AdminLayout>
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
            key: 'status',
            width: 110,
            render: (_, record) => {
                if (record.deleted_at) return <Tag color="error">Deleted</Tag>;
                return <Tag color={record.is_published ? 'success' : 'default'}>{record.is_published ? 'Published' : 'Draft'}</Tag>;
            },
        },
        {
            title: 'Layout',
            dataIndex: 'layout_type',
            key: 'layout_type',
            width: 100,
            render: (t) => t ? <Tag>{t}</Tag> : <Text type="secondary">—</Text>,
        },
        {
            title: 'Views',
            dataIndex: 'views',
            key: 'views',
            width: 80,
            align: 'center',
            render: (v) => <Text style={{ fontSize: 12 }}>{v ?? 0}</Text>,
        },
        {
            title: 'Responses',
            dataIndex: 'responses_count',
            key: 'responses_count',
            width: 100,
            align: 'center',
            render: (count) => (
                <Badge count={count} showZero style={{ backgroundColor: count ? '#10b981' : '#d9d9d9' }} />
            ),
        },
        {
            title: 'Created',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 110,
            render: (d) => <Text type="secondary" style={{ fontSize: 12 }}>{fmtDate(d)}</Text>,
        },
        {
            title: '',
            key: 'view',
            width: 80,
            render: (_, record) => (
                <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedForm(record)} style={{ borderRadius: 6 }}>View</Button>
            ),
        },
    ];

    return (
        <AdminLayout>
            {contextHolder}

            <Content style={{ padding: 28, background: '#f5f6fa', minHeight: '100vh' }}>
                {/* Read-only account inspector — this is not impersonation. */}
                <Button
                    type="text"
                    size="small"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.visit('/admin')}
                    style={{ marginBottom: 12, paddingInline: 4, color: '#6366f1' }}
                >
                    All merchants
                </Button>

                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 12, marginBottom: 24,
                }}>
                    <Space size={12}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: 18,
                            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                        }}>
                            <ShopOutlined />
                        </div>
                        <div>
                            <Title level={3} style={{ margin: 0, color: '#1a1a2e', fontWeight: 700, lineHeight: 1.2 }}>
                                {merchant.name}
                            </Title>
                            <Text type="secondary" style={{ fontSize: 13 }}>{merchant.email}</Text>
                        </div>
                    </Space>
                    <Space>
                        <Tag>Read only</Tag>
                        <PlanTag plan={merchant.plan} />
                        <Tag icon={active ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={active ? 'success' : 'default'}>
                            {active ? 'Active' : merchant.subscription_status ?? 'No subscription'}
                        </Tag>
                    </Space>
                </div>

                <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                    <Col xs={24} md={12}>
                        <Card
                            title={<Space><ShopOutlined style={{ color: '#6366f1' }} /><span>Account Info</span></Space>}
                            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}
                            size="small"
                        >
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Name"><Text strong>{merchant.name}</Text></Descriptions.Item>
                                <Descriptions.Item label="Email">{merchant.email}</Descriptions.Item>
                                <Descriptions.Item label="Login Type">
                                    <Tag>{merchant.login_type ?? 'manual'}</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Onboarding">
                                    <Tag color={merchant.onboarding_completed ? 'success' : 'warning'}>
                                        {merchant.onboarding_completed ? 'Completed' : 'Incomplete'}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Plan"><PlanTag plan={merchant.plan} /></Descriptions.Item>
                                <Descriptions.Item label="Signed Up">{fmtDate(merchant.created_at, true)}</Descriptions.Item>
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

                <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                    <Col xs={24} md={12}>
                        <Card
                            title={<Space><ApiOutlined style={{ color: '#3b82f6' }} /><span>Integrations</span><Tag color="blue">{merchant.integrations?.length ?? 0}</Tag></Space>}
                            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}
                            size="small"
                        >
                            {!merchant.integrations?.length ? (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No stores connected" />
                            ) : (
                                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                                    {merchant.integrations.map((i) => (
                                        <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                            <Space size={6}>
                                                <Tag color="geekblue">{i.type}</Tag>
                                                <Text style={{ fontSize: 12 }}>{i.name ?? i.url ?? '—'}</Text>
                                            </Space>
                                            <Tag icon={i.status ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={i.status ? 'success' : 'default'}>
                                                {i.status ? 'Connected' : 'Disconnected'}
                                            </Tag>
                                        </div>
                                    ))}
                                </Space>
                            )}
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card
                            title={<Space><CreditCardOutlined style={{ color: '#10b981' }} /><span>Subscriptions</span><Tag color="green">{merchant.subscriptions?.length ?? 0}</Tag></Space>}
                            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}
                            size="small"
                        >
                            {!merchant.subscriptions?.length ? (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Never subscribed" />
                            ) : (
                                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                                    {merchant.subscriptions.map((s) => (
                                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                            <Space size={6}>
                                                <PlanTag plan={s.plan_slug} />
                                                <Text type="secondary" style={{ fontSize: 11 }}>{s.provider}</Text>
                                            </Space>
                                            <Space size={6}>
                                                <Text type="secondary" style={{ fontSize: 11 }}>{fmtDate(s.created_at)}</Text>
                                                <Tag color={s.status === 'active' ? 'success' : 'default'}>{s.status}</Tag>
                                            </Space>
                                        </div>
                                    ))}
                                </Space>
                            )}
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
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
                                    rowClassName={(record) => selectedForm?.id === record.id ? 'ant-table-row-selected' : ''}
                                    scroll={{ x: 700 }}
                                />
                            )}
                        </Card>
                    </Col>

                    {selectedForm && (
                        <Col xs={24} lg={12}>
                            <Card
                                title={
                                    <Space>
                                        <FormOutlined style={{ color: '#6366f1' }} />
                                        <span style={{ fontWeight: 600 }}>{selectedForm.title || 'Untitled Form'}</span>
                                        {selectedForm.deleted_at
                                            ? <Tag color="error">Deleted</Tag>
                                            : <Tag color={selectedForm.is_published ? 'success' : 'default'}>
                                                {selectedForm.is_published ? 'Published' : 'Draft'}
                                              </Tag>}
                                    </Space>
                                }
                                extra={<Button size="small" type="text" onClick={() => setSelectedForm(null)}>✕</Button>}
                                style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                            >
                                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                                    <Descriptions column={1} size="small">
                                        <Descriptions.Item label="Form ID">
                                            <Text code style={{ fontSize: 11 }}>{selectedForm.ulid}</Text>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Layout">
                                            {selectedForm.layout_type ? <Tag>{selectedForm.layout_type}</Tag> : '—'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Views">{selectedForm.views ?? 0}</Descriptions.Item>
                                        <Descriptions.Item label="Responses">{selectedForm.responses_count ?? 0}</Descriptions.Item>
                                        <Descriptions.Item label="Compiled">
                                            <Tag color={selectedForm.has_compiled ? 'success' : 'warning'}>
                                                {selectedForm.has_compiled ? 'Yes' : 'No'}
                                            </Tag>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Created">{fmtDate(selectedForm.created_at, true)}</Descriptions.Item>
                                        <Descriptions.Item label="Updated">{fmtDate(selectedForm.updated_at, true)}</Descriptions.Item>
                                        {selectedForm.deleted_at && (
                                            <Descriptions.Item label="Deleted">{fmtDate(selectedForm.deleted_at, true)}</Descriptions.Item>
                                        )}
                                    </Descriptions>

                                    <div>
                                        <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                                            Source ({selectedForm.layout_type ?? 'html'})
                                        </Text>
                                        <div style={{ marginTop: 6 }}>
                                            {sourceLoading
                                                ? <Spin size="small" />
                                                : <CodeBlock code={source?.html_content} empty="No source stored" />}
                                        </div>
                                    </div>
                                </Space>
                            </Card>
                        </Col>
                    )}
                </Row>
            </Content>
        </AdminLayout>
    );
}
