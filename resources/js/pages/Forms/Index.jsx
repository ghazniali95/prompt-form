import React, { useState } from 'react';
import {
    Button, Table, Tag, Typography, Row, Col,
    Card, Dropdown, Empty, Modal, Input, message,
} from 'antd';
import {
    RobotOutlined, EditOutlined, DeleteOutlined,
    EyeOutlined, MoreOutlined, CopyOutlined, FileTextOutlined,
    CheckCircleOutlined, ClockCircleOutlined, BarChartOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import AuthLayout from '@layouts/AuthLayout';
import AiFormDrawer from '@components/Forms/AiFormDrawer';

const { Title, Text } = Typography;

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }) {
    return (
        <Card styles={{ body: { padding: '20px 24px' } }} style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {React.cloneElement(icon, { style: { fontSize: 18, color } })}
                </div>
                <div>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {label}
                    </Text>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#111', lineHeight: 1.2 }}>{value}</div>
                </div>
            </div>
        </Card>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FormsIndex({ user, forms: serverForms, stats: serverStats }) {
    const [forms, setForms]             = useState(serverForms ?? []);
    const stats                         = serverStats ?? { total: 0, published: 0, drafts: 0, submissions: 0 };

    // Name modal
    const [nameModalOpen, setNameModalOpen] = useState(false);
    const [nameInput, setNameInput]         = useState('');
    const [nameLoading, setNameLoading]     = useState(false);

    // Chat drawer
    const [drawerOpen, setDrawerOpen]   = useState(false);
    const [activeForm, setActiveForm]   = useState(null);

    const openDrawerForNew = () => {
        setNameInput('');
        setNameModalOpen(true);
    };

    const openDrawerForForm = (record) => {
        setActiveForm(record);
        setDrawerOpen(true);
    };

    const handleCreateDraft = async () => {
        const title = nameInput.trim();
        if (!title) return;
        setNameLoading(true);
        try {
            const { data } = await axios.post('/api/v1/forms', { title });
            const created = data.data;
            setForms(prev => [
                {
                    id:          created.id,
                    ulid:        created.ulid,
                    title:       created.title,
                    status:      'draft',
                    submissions: 0,
                    views:       0,
                    updated_at:  new Date().toISOString().slice(0, 10),
                },
                ...prev,
            ]);
            setNameModalOpen(false);
            setActiveForm(created);
            setDrawerOpen(true);
        } catch (err) {
            const msg = err.response?.data?.message ?? 'Failed to create form.';
            message.error(msg);
        } finally {
            setNameLoading(false);
        }
    };

    const handleDrawerClose = () => {
        setDrawerOpen(false);
        setActiveForm(null);
    };

    const handleFormUpdated = (updated) => {
        setForms(prev => prev.map(f => f.id === updated.id ? { ...f, ...updated } : f));
    };

    const rowActions = (record) => [
        { key: 'edit',    icon: <EditOutlined />,   label: 'Edit with AI',     onClick: () => openDrawerForForm(record) },
        { key: 'preview', icon: <EyeOutlined />,    label: 'Preview' },
        { key: 'copy',    icon: <CopyOutlined />,   label: 'Copy embed code' },
        { type: 'divider' },
        { key: 'delete',  icon: <DeleteOutlined />, label: 'Delete', danger: true },
    ];

    const columns = [
        {
            title: 'Form',
            dataIndex: 'title',
            key: 'title',
            render: (title, record) => (
                <div>
                    <Text strong style={{ fontSize: 14 }}>{title}</Text>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                        ID: {record.ulid?.slice(-8) ?? record.id}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            render: s => s === 'published'
                ? <Tag color="success" icon={<CheckCircleOutlined />}>Published</Tag>
                : <Tag color="default" icon={<ClockCircleOutlined />}>Draft</Tag>,
        },
        {
            title: 'Views',
            dataIndex: 'views',
            key: 'views',
            width: 100,
            align: 'right',
            render: v => <Text>{(v ?? 0).toLocaleString()}</Text>,
        },
        {
            title: 'Submissions',
            dataIndex: 'submissions',
            key: 'submissions',
            width: 130,
            align: 'right',
            render: v => <Text strong style={{ color: v > 0 ? '#f97316' : '#bbb' }}>{(v ?? 0).toLocaleString()}</Text>,
        },
        {
            title: 'Last Updated',
            dataIndex: 'updated_at',
            key: 'updated_at',
            width: 140,
            render: d => <Text type="secondary" style={{ fontSize: 13 }}>{d}</Text>,
        },
        {
            title: '',
            key: 'actions',
            width: 48,
            render: (_, record) => (
                <Dropdown menu={{ items: rowActions(record) }} trigger={['click']} placement="bottomRight">
                    <Button type="text" icon={<MoreOutlined />} style={{ color: '#aaa' }} />
                </Dropdown>
            ),
        },
    ];

    return (
        <AuthLayout user={user}>
            <div style={{ padding: '40px' }}>

                {/* Header */}
                <Row justify="space-between" align="middle" style={{ marginBottom: 28 }}>
                    <Col>
                        <Title level={3} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>Forms</Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            {stats.total} form{stats.total !== 1 ? 's' : ''} · {stats.submissions} total submissions
                        </Text>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            size="large"
                            icon={<RobotOutlined />}
                            onClick={openDrawerForNew}
                            style={{ fontWeight: 700 }}
                        >
                            Create with AI
                        </Button>
                    </Col>
                </Row>

                {/* Stats */}
                <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
                    <Col xs={12} sm={6}><StatCard icon={<FileTextOutlined />}    label="Total Forms"  value={stats.total}       color="#6366f1" /></Col>
                    <Col xs={12} sm={6}><StatCard icon={<CheckCircleOutlined />} label="Published"    value={stats.published}   color="#22c55e" /></Col>
                    <Col xs={12} sm={6}><StatCard icon={<ClockCircleOutlined />} label="Drafts"       value={stats.drafts}      color="#f59e0b" /></Col>
                    <Col xs={12} sm={6}><StatCard icon={<BarChartOutlined />}    label="Submissions"  value={stats.submissions} color="#f97316" /></Col>
                </Row>

                {/* Table */}
                <Card style={{ borderRadius: 12, border: '1px solid #f0f0f0' }} styles={{ body: { padding: 0 } }}>
                    <Table
                        dataSource={forms}
                        columns={columns}
                        rowKey="id"
                        pagination={forms.length > 10 ? { pageSize: 10 } : false}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        <span>
                                            No forms yet.{' '}
                                            <a onClick={openDrawerForNew} style={{ color: '#f97316', fontWeight: 600 }}>
                                                Create your first form with AI
                                            </a>
                                        </span>
                                    }
                                />
                            ),
                        }}
                        style={{ borderRadius: 12, overflow: 'hidden' }}
                    />
                </Card>
            </div>

            {/* ── Name modal ── */}
            <Modal
                open={nameModalOpen}
                onCancel={() => setNameModalOpen(false)}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: '#f974161a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <RobotOutlined style={{ fontSize: 18, color: '#f97316' }} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>Name your form</div>
                            <div style={{ fontWeight: 400, fontSize: 12, color: '#999', marginTop: 2 }}>
                                You can always rename it later
                            </div>
                        </div>
                    </div>
                }
                footer={[
                    <Button key="cancel" onClick={() => setNameModalOpen(false)} disabled={nameLoading}>
                        Cancel
                    </Button>,
                    <Button
                        key="create"
                        type="primary"
                        loading={nameLoading}
                        disabled={!nameInput.trim()}
                        onClick={handleCreateDraft}
                        style={{ fontWeight: 700 }}
                    >
                        Create Draft
                    </Button>,
                ]}
                width={440}
                destroyOnHidden
            >
                <div style={{ padding: '20px 0 8px' }}>
                    <Input
                        autoFocus
                        size="large"
                        placeholder="e.g. Contact Us, Newsletter Signup…"
                        value={nameInput}
                        onChange={e => setNameInput(e.target.value)}
                        onPressEnter={handleCreateDraft}
                        maxLength={255}
                        style={{ borderRadius: 10 }}
                    />
                    <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                        Press Enter or click Create Draft to continue.
                    </Text>
                </div>
            </Modal>

            {/* ── Chat drawer ── */}
            <AiFormDrawer
                open={drawerOpen}
                form={activeForm}
                onClose={handleDrawerClose}
                onFormUpdated={handleFormUpdated}
            />
        </AuthLayout>
    );
}
