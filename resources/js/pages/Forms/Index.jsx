import React, { useState, useEffect, useMemo } from 'react';
import {
    Button, Typography, Row, Col, Card, Empty, Modal, Input, message, Spin,
} from 'antd';
import {
    RobotOutlined, FileTextOutlined,
    CheckCircleOutlined, ClockCircleOutlined, BarChartOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import AuthLayout from '@layouts/AuthLayout';
import AiFormDrawer from '@components/Forms/AiFormDrawer';
import FormsTable from '@components/Forms/FormsTable';

const { Title, Text } = Typography;

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

export default function FormsIndex({ user }) {
    const [forms, setForms]     = useState([]);
    const [loading, setLoading] = useState(true);

    const [nameModalOpen, setNameModalOpen] = useState(false);
    const [nameInput, setNameInput]         = useState('');
    const [nameLoading, setNameLoading]     = useState(false);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeForm, setActiveForm] = useState(null);

    useEffect(() => {
        axios.get('/api/v1/forms?per_page=100')
            .then(({ data }) => setForms(data.data ?? []))
            .catch(() => message.error('Failed to load forms.'))
            .finally(() => setLoading(false));
    }, []);

    const stats = useMemo(() => ({
        total:       forms.length,
        published:   forms.filter(f => f.status === 'published').length,
        drafts:      forms.filter(f => f.status === 'draft').length,
        submissions: forms.reduce((s, f) => s + (f.submissions ?? 0), 0),
    }), [forms]);

    const handleCreateDraft = async () => {
        const title = nameInput.trim();
        if (!title) return;
        setNameLoading(true);
        try {
            const { data } = await axios.post('/api/v1/forms', { title });
            const created = data.data;
            setForms(prev => [created, ...prev]);
            setNameModalOpen(false);
            setActiveForm(created);
            setDrawerOpen(true);
        } catch (err) {
            message.error(err.response?.data?.message ?? 'Failed to create form.');
        } finally {
            setNameLoading(false);
        }
    };

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
                            onClick={() => { setNameInput(''); setNameModalOpen(true); }}
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
                    <Spin spinning={loading}>
                        <FormsTable
                            forms={forms}
                            loading={false}
                            pagination={forms.length > 10 ? { pageSize: 10 } : false}
                            onEditWithAI={form => { setActiveForm(form); setDrawerOpen(true); }}
                            onFormUpdated={updated => setForms(prev => prev.map(f => f.id === updated.id ? { ...f, ...updated } : f))}
                            onFormDeleted={id => setForms(prev => prev.filter(f => f.id !== id))}
                            emptyText={
                                loading ? <div style={{ padding: 40 }} /> : (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={
                                            <span>
                                                No forms yet.{' '}
                                                <a onClick={() => { setNameInput(''); setNameModalOpen(true); }} style={{ color: '#f97316', fontWeight: 600 }}>
                                                    Create your first form with AI
                                                </a>
                                            </span>
                                        }
                                    />
                                )
                            }
                        />
                    </Spin>
                </Card>
            </div>

            {/* Name modal */}
            <Modal
                open={nameModalOpen}
                onCancel={() => setNameModalOpen(false)}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f974161a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <RobotOutlined style={{ fontSize: 18, color: '#f97316' }} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>Name your form</div>
                            <div style={{ fontWeight: 400, fontSize: 12, color: '#999', marginTop: 2 }}>You can always rename it later</div>
                        </div>
                    </div>
                }
                footer={[
                    <Button key="cancel" onClick={() => setNameModalOpen(false)} disabled={nameLoading}>Cancel</Button>,
                    <Button key="create" type="primary" loading={nameLoading} disabled={!nameInput.trim()} onClick={handleCreateDraft} style={{ fontWeight: 700 }}>
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

            {/* AI drawer */}
            <AiFormDrawer
                open={drawerOpen}
                form={activeForm}
                onClose={() => { setDrawerOpen(false); setActiveForm(null); }}
                onFormUpdated={updated => setForms(prev => prev.map(f => f.id === updated.id ? { ...f, ...updated } : f))}
            />
        </AuthLayout>
    );
}
