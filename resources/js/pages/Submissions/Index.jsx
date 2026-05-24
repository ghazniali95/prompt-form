import React, { useState, useEffect, useMemo } from 'react';
import {
    Button, Card, Col, Empty, Row, Select, Spin, Table,
    Typography, Statistic, Input, Space, Tooltip, message, Modal,
} from 'antd';
import {
    InboxOutlined, SearchOutlined, DownloadOutlined,
    CalendarOutlined, FormOutlined, ExpandAltOutlined, DeleteOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import AuthLayout from '@layouts/AuthLayout';

const { Title, Text } = Typography;

function formatDate(val) {
    if (!val) return '—';
    return new Date(val).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function DataCell({ value }) {
    if (value === null || value === undefined || value === '') return <Text type="secondary">—</Text>;
    if (Array.isArray(value)) return <Text>{value.join(', ')}</Text>;
    const str = String(value);
    if (str.length > 60) {
        return (
            <Tooltip title={str}>
                <Text style={{ cursor: 'default' }}>{str.slice(0, 60)}…</Text>
            </Tooltip>
        );
    }
    return <Text>{str}</Text>;
}

function ExpandedRow({ data }) {
    const entries = Object.entries(data ?? {});
    if (!entries.length) return <Text type="secondary">No data recorded.</Text>;
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px 24px',
            padding: '4px 0',
        }}>
            {entries.map(([key, val]) => (
                <div key={key}>
                    <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                        {key.replace(/_/g, ' ')}
                    </Text>
                    <DataCell value={val} />
                </div>
            ))}
        </div>
    );
}

export default function SubmissionsIndex({ user }) {
    const [forms, setForms]               = useState([]);
    const [submissions, setSubmissions]   = useState([]);
    const [selectedForm, setSelectedForm] = useState(null);
    const [formsLoading, setFormsLoading] = useState(true);
    const [loading, setLoading]           = useState(false);
    const [search, setSearch]             = useState('');
    const [expandedRows, setExpandedRows] = useState([]);

    // ── Load forms for the selector ───────────────────────────────────────────

    useEffect(() => {
        axios.get('/api/v1/forms?per_page=100')
            .then(({ data }) => {
                const list = data.data ?? [];
                setForms(list);
                if (list.length > 0) setSelectedForm(list[0].id);
            })
            .finally(() => setFormsLoading(false));
    }, []);

    // ── Load submissions when form selection changes ───────────────────────────

    useEffect(() => {
        if (!selectedForm) return;
        setLoading(true);
        setExpandedRows([]);
        axios.get(`/api/v1/submissions?form_id=${selectedForm}&per_page=100`)
            .then(({ data }) => setSubmissions(data.data ?? []))
            .catch(() => message.error('Failed to load submissions.'))
            .finally(() => setLoading(false));
    }, [selectedForm]);

    // ── Delete ────────────────────────────────────────────────────────────────

    const handleDelete = (record) => {
        Modal.confirm({
            title: 'Delete this submission?',
            content: 'This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            onOk: () => axios.delete(`/api/v1/submissions/${record.id}`)
                .then(() => {
                    setSubmissions(prev => prev.filter(s => s.id !== record.id));
                    message.success('Submission deleted.');
                })
                .catch(() => message.error('Failed to delete submission.')),
        });
    };

    // ── Export CSV ────────────────────────────────────────────────────────────

    const handleExport = () => {
        if (!filtered.length) return;
        const allKeys = [...new Set(filtered.flatMap(r => Object.keys(r.data ?? {})))];
        const rows = [
            ['Date', ...allKeys],
            ...filtered.map(r => [
                formatDate(r.submitted_at),
                ...allKeys.map(k => {
                    const v = r.data?.[k];
                    return Array.isArray(v) ? v.join('; ') : (v ?? '');
                }),
            ]),
        ];
        const csv  = rows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `${activeForm?.title ?? 'submissions'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Derived state ─────────────────────────────────────────────────────────

    const activeForm = forms.find(f => f.id === selectedForm);

    const filtered = useMemo(() => {
        if (!search) return submissions;
        const q = search.toLowerCase();
        return submissions.filter(r => JSON.stringify(r.data ?? {}).toLowerCase().includes(q));
    }, [submissions, search]);

    const thisMonth = useMemo(() => submissions.filter(r => {
        const d = new Date(r.submitted_at ?? '');
        return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
    }).length, [submissions]);

    const fieldKeys = submissions.length > 0
        ? Object.keys(submissions[0].data ?? {}).slice(0, 5)
        : [];

    const columns = [
        {
            title:  'Date',
            key:    'date',
            width:  160,
            render: (_, r) => (
                <Text type="secondary" style={{ fontSize: 13 }}>
                    {formatDate(r.submitted_at)}
                </Text>
            ),
        },
        ...fieldKeys.map(key => ({
            title:    <span style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>,
            key,
            ellipsis: true,
            render:   (_, r) => <DataCell value={r.data?.[key]} />,
        })),
        {
            title:  '',
            key:    'actions',
            width:  80,
            render: (_, r) => (
                <Space>
                    <Tooltip title="Expand row">
                        <Button
                            type="text"
                            size="small"
                            icon={<ExpandAltOutlined />}
                            style={{ color: '#aaa' }}
                            onClick={() => setExpandedRows(prev =>
                                prev.includes(r.id) ? prev.filter(id => id !== r.id) : [...prev, r.id]
                            )}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(r)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <AuthLayout user={user}>
            <div style={{ padding: '40px' }}>

                {/* Header */}
                <Row justify="space-between" align="middle" style={{ marginBottom: 28 }}>
                    <Col>
                        <Title level={3} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>
                            Submissions
                        </Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            View and export responses collected by your forms.
                        </Text>
                    </Col>
                    <Col>
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={handleExport}
                            disabled={!filtered.length}
                        >
                            Export CSV
                        </Button>
                    </Col>
                </Row>

                {/* Stats */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={12} sm={8}>
                        <Card styles={{ body: { padding: '20px 24px' } }} style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}>
                            <Statistic
                                title={<span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>Total Responses</span>}
                                value={submissions.length}
                                valueStyle={{ fontSize: 28, fontWeight: 800, color: '#111' }}
                                prefix={<InboxOutlined style={{ color: '#f97316', marginRight: 6 }} />}
                            />
                        </Card>
                    </Col>
                    <Col xs={12} sm={8}>
                        <Card styles={{ body: { padding: '20px 24px' } }} style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}>
                            <Statistic
                                title={<span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>This Month</span>}
                                value={thisMonth}
                                valueStyle={{ fontSize: 28, fontWeight: 800, color: '#111' }}
                                prefix={<CalendarOutlined style={{ color: '#6366f1', marginRight: 6 }} />}
                            />
                        </Card>
                    </Col>
                    <Col xs={12} sm={8}>
                        <Card styles={{ body: { padding: '20px 24px' } }} style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}>
                            <Statistic
                                title={<span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>Viewing Form</span>}
                                value={activeForm?.title ?? '—'}
                                valueStyle={{ fontSize: 18, fontWeight: 700, color: '#111' }}
                                prefix={<FormOutlined style={{ color: '#22c55e', marginRight: 6 }} />}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Toolbar */}
                <Card style={{ borderRadius: 12, border: '1px solid #f0f0f0', marginBottom: 16 }} styles={{ body: { padding: '16px 20px' } }}>
                    <Space wrap>
                        <Select
                            loading={formsLoading}
                            value={selectedForm}
                            onChange={val => { setSelectedForm(val); setSearch(''); }}
                            style={{ minWidth: 260 }}
                            placeholder="Select a form"
                            options={forms.map(f => ({ label: f.title, value: f.id }))}
                        />
                        <Input
                            prefix={<SearchOutlined style={{ color: '#ccc' }} />}
                            placeholder="Search submissions…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            allowClear
                            style={{ width: 240 }}
                        />
                    </Space>
                </Card>

                {/* Table */}
                <Card style={{ borderRadius: 12, border: '1px solid #f0f0f0' }} styles={{ body: { padding: 0 } }}>
                    <Spin spinning={loading}>
                        <Table
                            dataSource={filtered}
                            columns={columns}
                            rowKey="id"
                            size="middle"
                            expandable={{
                                expandedRowKeys:   expandedRows,
                                showExpandColumn:  false,
                                expandedRowRender: r => <ExpandedRow data={r.data} />,
                            }}
                            pagination={filtered.length > 20 ? { pageSize: 20, showSizeChanger: false } : false}
                            locale={{
                                emptyText: (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={
                                            selectedForm
                                                ? 'No submissions yet for this form.'
                                                : 'Select a form to view submissions.'
                                        }
                                    />
                                ),
                            }}
                            style={{ borderRadius: 12, overflow: 'hidden' }}
                        />
                    </Spin>
                </Card>
            </div>
        </AuthLayout>
    );
}
