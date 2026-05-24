import React, { useState, useEffect } from 'react';
import {
    Typography, Row, Col, Card, Button,
    Spin, Empty, Modal, Input, message,
} from 'antd';
import {
    FileTextOutlined, InboxOutlined, CheckCircleOutlined,
    RobotOutlined, ArrowRightOutlined, ApiOutlined,
} from '@ant-design/icons';
import { router } from '@inertiajs/react';
import axios from 'axios';
import AuthLayout from '@layouts/AuthLayout';
import AiFormDrawer from '@components/Forms/AiFormDrawer';
import FormsTable from '@components/Forms/FormsTable';

const { Title, Text } = Typography;

function StatCard({ icon, label, value, sub, color, loading }) {
    return (
        <Card styles={{ body: { padding: '22px 24px' } }} style={{ borderRadius: 12, border: '1px solid #f0f0f0', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                    background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {React.cloneElement(icon, { style: { fontSize: 19, color } })}
                </div>
                <div style={{ minWidth: 0 }}>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                        {label}
                    </Text>
                    {loading
                        ? <div style={{ height: 32, background: '#f5f5f5', borderRadius: 6, width: 60, marginBottom: 4 }} />
                        : <div style={{ fontSize: 28, fontWeight: 800, color: '#111', lineHeight: 1.1 }}>{value ?? 0}</div>
                    }
                    {sub && (
                        <Text type="secondary" style={{ fontSize: 12, marginTop: 2, display: 'block' }}>{sub}</Text>
                    )}
                </div>
            </div>
        </Card>
    );
}


export default function Dashboard({ user }) {
    const [stats, setStats]     = useState(null);
    const [forms, setForms]     = useState([]);
    const [loading, setLoading] = useState(true);

    const [nameModalOpen, setNameModalOpen] = useState(false);
    const [nameInput, setNameInput]         = useState('');
    const [nameLoading, setNameLoading]     = useState(false);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeForm, setActiveForm] = useState(null);

    useEffect(() => {
        Promise.all([
            axios.get('/api/v1/stats'),
            axios.get('/api/v1/forms?per_page=5'),
        ])
            .then(([statsRes, formsRes]) => {
                setStats(statsRes.data.data);
                setForms(formsRes.data.data ?? []);
            })
            .catch(() => message.error('Failed to load dashboard data.'))
            .finally(() => setLoading(false));
    }, []);

    const handleCreateDraft = async () => {
        const title = nameInput.trim();
        if (!title) return;
        setNameLoading(true);
        try {
            const { data } = await axios.post('/api/v1/forms', { title });
            const created = data.data;
            setForms(prev => [created, ...prev].slice(0, 5));
            setStats(prev => prev ? { ...prev, total_forms: prev.total_forms + 1, draft_forms: prev.draft_forms + 1 } : prev);
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
                <div style={{ marginBottom: 28 }}>
                    <Title level={3} style={{ fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px' }}>
                        Welcome back, {user.name}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                        Here's what's happening with your forms.
                    </Text>
                </div>

                {/* Stat cards */}
                <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
                    <Col xs={12} sm={6}>
                        <StatCard icon={<FileTextOutlined />} label="Total Forms" value={stats?.total_forms}
                            sub={stats?.forms_limit ? `of ${stats.forms_limit} allowed` : null} color="#6366f1" loading={loading} />
                    </Col>
                    <Col xs={12} sm={6}>
                        <StatCard icon={<CheckCircleOutlined />} label="Published" value={stats?.published_forms}
                            sub={stats ? `${stats.draft_forms} draft${stats.draft_forms !== 1 ? 's' : ''}` : null} color="#22c55e" loading={loading} />
                    </Col>
                    <Col xs={12} sm={6}>
                        <StatCard icon={<InboxOutlined />} label="Total Submissions" value={stats?.total_submissions}
                            sub={stats?.submissions_limit ? `${stats.submissions_left ?? 0} remaining` : null} color="#f97316" loading={loading} />
                    </Col>
                    <Col xs={12} sm={6}>
                        <StatCard icon={<ApiOutlined />} label="Integrations" value={stats?.integrations_count}
                            sub="connected" color="#6366f1" loading={loading} />
                    </Col>
                </Row>

                {/* Recent Forms */}
                <Card
                    style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
                    styles={{ body: { padding: 0 } }}
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 0' }}>
                            <Text strong style={{ fontSize: 15 }}>Recent Forms</Text>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Button type="primary" icon={<RobotOutlined />} size="small"
                                    onClick={() => { setNameInput(''); setNameModalOpen(true); }} style={{ fontWeight: 700 }}>
                                    Create with AI
                                </Button>
                                <Button size="small" icon={<ArrowRightOutlined />} onClick={() => router.visit('/forms')}>
                                    View all
                                </Button>
                            </div>
                        </div>
                    }
                >
                    <Spin spinning={loading}>
                        <FormsTable
                            forms={forms}
                            loading={false}
                            pagination={false}
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
