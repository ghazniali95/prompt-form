import React, { useState, useEffect } from 'react';
import {
    Card, Col, Row, Spin, Table, Tag, Typography,
    Empty, Statistic, Select,
} from 'antd';
import {
    FileTextOutlined, InboxOutlined, RiseOutlined, BarChartOutlined,
    CheckCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from 'recharts';
import axios from 'axios';
import AuthLayout from '@layouts/AuthLayout';

const { Title, Text } = Typography;

function StatCard({ icon, label, value, sub, color }) {
    return (
        <Card styles={{ body: { padding: '20px 24px' } }} style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: color + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                    {React.cloneElement(icon, { style: { fontSize: 20, color } })}
                </div>
                <Statistic
                    title={<span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>}
                    value={value ?? '—'}
                    suffix={sub ? <span style={{ fontSize: 12, fontWeight: 400, color: '#aaa', marginLeft: 4 }}>{sub}</span> : null}
                    valueStyle={{ fontSize: 26, fontWeight: 800, color: '#111' }}
                />
            </div>
        </Card>
    );
}

function TrendTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: '#fff', border: '1px solid #f0f0f0',
            borderRadius: 8, padding: '8px 14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 13,
        }}>
            <div style={{ color: '#888', marginBottom: 2, fontSize: 12 }}>{label}</div>
            <div style={{ fontWeight: 700, color: '#f97316' }}>
                {payload[0].value} submission{payload[0].value !== 1 ? 's' : ''}
            </div>
        </div>
    );
}

function BarTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const { full, count } = payload[0].payload;
    return (
        <div style={{
            background: '#fff', border: '1px solid #f0f0f0',
            borderRadius: 8, padding: '8px 14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 13, maxWidth: 200,
        }}>
            <div style={{ color: '#555', marginBottom: 2, fontSize: 12, wordBreak: 'break-word' }}>{full}</div>
            <div style={{ fontWeight: 700, color: '#f97316' }}>{count} submission{count !== 1 ? 's' : ''}</div>
        </div>
    );
}

const RANGE_OPTIONS = [
    { label: 'Last 7 days',  value: 7  },
    { label: 'Last 30 days', value: 30 },
    { label: 'Last 90 days', value: 90 },
];

export default function Analytics({ user }) {
    const [stats,     setStats]     = useState(null);
    const [overview,  setOverview]  = useState(null);
    const [loading,   setLoading]   = useState(true);
    const [days,      setDays]      = useState(30);
    const [trendLoading, setTrendLoading] = useState(false);

    // ── Initial load: stats + overview ────────────────────────────────────────

    useEffect(() => {
        setLoading(true);
        Promise.all([
            axios.get('/api/v1/stats'),
            axios.get(`/api/v1/analytics/overview?days=${days}`),
        ])
            .then(([statsRes, overviewRes]) => {
                setStats(statsRes.data.data);
                setOverview(overviewRes.data.data);
            })
            .finally(() => setLoading(false));
    }, []);

    // ── Reload trend when date range changes ──────────────────────────────────

    const handleRangeChange = (val) => {
        setDays(val);
        setTrendLoading(true);
        axios.get(`/api/v1/analytics/overview?days=${val}`)
            .then(res => setOverview(res.data.data))
            .finally(() => setTrendLoading(false));
    };

    // ── Derived data ──────────────────────────────────────────────────────────

    const forms    = overview?.forms_breakdown ?? [];
    const topForm  = overview?.top_form;
    const trend    = overview?.trend ?? [];

    // Show every Nth label to avoid crowding
    const tickInterval = days <= 7 ? 0 : days <= 30 ? 4 : 13;

    const chartData = [...forms]
        .slice(0, 10)
        .map(f => ({
            name:  f.title.length > 20 ? f.title.slice(0, 18) + '…' : f.title,
            full:  f.title,
            count: f.submissions ?? 0,
        }));

    const avgPerForm = forms.length > 0
        ? ((overview?.total_submissions ?? 0) / forms.length).toFixed(1)
        : '0';

    const columns = [
        {
            title:     'Form',
            dataIndex: 'title',
            key:       'title',
            render:    title => <Text strong style={{ fontSize: 14 }}>{title}</Text>,
        },
        {
            title:  'Status',
            key:    'status',
            width:  120,
            render: (_, r) => r.status === 'published'
                ? <Tag color="success" icon={<CheckCircleOutlined />}>Published</Tag>
                : <Tag color="default" icon={<ClockCircleOutlined />}>Draft</Tag>,
        },
        {
            title:          'Submissions',
            dataIndex:      'submissions',
            key:            'submissions',
            width:          140,
            align:          'right',
            sorter:         (a, b) => (a.submissions ?? 0) - (b.submissions ?? 0),
            defaultSortOrder: 'descend',
            render:         v => (
                <Text strong style={{ fontSize: 15, color: (v ?? 0) > 0 ? '#f97316' : '#bbb' }}>
                    {(v ?? 0).toLocaleString()}
                </Text>
            ),
        },
        {
            title:  'Share',
            key:    'share',
            width:  100,
            align:  'right',
            render: (_, r) => <Text type="secondary">{r.share ?? 0}%</Text>,
        },
        {
            title:     'Last Updated',
            dataIndex: 'updated_at',
            key:       'updated_at',
            width:     140,
            render:    d => <Text type="secondary" style={{ fontSize: 13 }}>{d?.slice(0, 10) ?? '—'}</Text>,
        },
    ];

    return (
        <AuthLayout user={user}>
            <div style={{ padding: '40px' }}>

                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <Title level={3} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>
                        Analytics
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        An overview of your forms' performance and submission trends.
                    </Text>
                </div>

                <Spin spinning={loading}>

                    {/* Stat cards */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
                        <Col xs={12} sm={6}>
                            <StatCard icon={<FileTextOutlined />} label="Total Forms"      value={stats?.total_forms}       color="#6366f1" />
                        </Col>
                        <Col xs={12} sm={6}>
                            <StatCard icon={<InboxOutlined />}    label="Total Submissions" value={stats?.total_submissions} color="#f97316" />
                        </Col>
                        <Col xs={12} sm={6}>
                            <StatCard icon={<RiseOutlined />}     label="Remaining"         value={stats?.submissions_left ?? '∞'} color="#22c55e" />
                        </Col>
                        <Col xs={12} sm={6}>
                            <StatCard icon={<BarChartOutlined />} label="Avg / Form"        value={avgPerForm} sub="subs" color="#8b5cf6" />
                        </Col>
                    </Row>

                    {/* 30-day trend */}
                    <Card
                        style={{ borderRadius: 12, border: '1px solid #f0f0f0', marginBottom: 20 }}
                        title={
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 700 }}>Submission Trend</span>
                                <Select
                                    size="small"
                                    value={days}
                                    onChange={handleRangeChange}
                                    options={RANGE_OPTIONS}
                                    style={{ width: 130 }}
                                    loading={trendLoading}
                                />
                            </div>
                        }
                    >
                        {trend.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data yet." style={{ padding: '40px 0' }} />
                        ) : (
                            <Spin spinning={trendLoading}>
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                                        <defs>
                                            <linearGradient id="submissionGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#f97316" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 11, fill: '#bbb' }}
                                            axisLine={false}
                                            tickLine={false}
                                            interval={tickInterval}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: '#bbb' }}
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false}
                                            width={28}
                                        />
                                        <Tooltip content={<TrendTooltip />} cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#f97316"
                                            strokeWidth={2}
                                            fill="url(#submissionGradient)"
                                            dot={false}
                                            activeDot={{ r: 4, fill: '#f97316' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Spin>
                        )}
                    </Card>

                    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>

                        {/* Submissions per form bar chart */}
                        <Col xs={24} lg={14}>
                            <Card
                                title={<span style={{ fontWeight: 700 }}>Submissions per Form</span>}
                                style={{ borderRadius: 12, border: '1px solid #f0f0f0', height: '100%' }}
                            >
                                {chartData.length === 0 ? (
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data yet." style={{ padding: '40px 0' }} />
                                ) : (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 40, left: -8 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 11, fill: '#aaa' }}
                                                axisLine={false}
                                                tickLine={false}
                                                angle={-25}
                                                textAnchor="end"
                                                interval={0}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11, fill: '#aaa' }}
                                                axisLine={false}
                                                tickLine={false}
                                                allowDecimals={false}
                                                width={32}
                                            />
                                            <Tooltip content={<BarTooltip />} cursor={{ fill: '#fff8f3' }} />
                                            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                                                {chartData.map((_, i) => (
                                                    <Cell key={i} fill={i === 0 ? '#f97316' : '#e5e7eb'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </Card>
                        </Col>

                        {/* Top form */}
                        <Col xs={24} lg={10}>
                            <Card
                                title={<span style={{ fontWeight: 700 }}>Top Form</span>}
                                style={{ borderRadius: 12, border: '1px solid #f0f0f0', height: '100%' }}
                            >
                                {!topForm ? (
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No forms yet." style={{ padding: '40px 0' }} />
                                ) : (
                                    <div style={{ padding: '8px 0' }}>
                                        <div style={{
                                            background: 'linear-gradient(135deg, #fff8f3 0%, #fff5ee 100%)',
                                            border: '1px solid #fed7aa', borderRadius: 12,
                                            padding: '20px', marginBottom: 16,
                                        }}>
                                            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Most responses
                                            </Text>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginTop: 4, marginBottom: 4 }}>
                                                {topForm.title}
                                            </div>
                                            <div style={{ fontSize: 28, fontWeight: 800, color: '#f97316' }}>
                                                {(topForm.submissions ?? 0).toLocaleString()}
                                                <Text type="secondary" style={{ fontSize: 14, fontWeight: 400, marginLeft: 6 }}>submissions</Text>
                                            </div>
                                        </div>
                                        {stats && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Text type="secondary" style={{ fontSize: 13 }}>Plan limit</Text>
                                                    <Text strong>
                                                        {stats.submissions_limit ? stats.submissions_limit.toLocaleString() : 'Unlimited'}
                                                    </Text>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Text type="secondary" style={{ fontSize: 13 }}>Remaining</Text>
                                                    <Text strong style={{
                                                        color: stats.submissions_left !== null && stats.submissions_left <= 10
                                                            ? '#ef4444' : '#22c55e',
                                                    }}>
                                                        {stats.submissions_left ?? '∞'}
                                                    </Text>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Text type="secondary" style={{ fontSize: 13 }}>This month</Text>
                                                    <Text strong>{stats.submissions_this_month ?? 0}</Text>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        </Col>
                    </Row>

                    {/* All forms table */}
                    <Card
                        title={<span style={{ fontWeight: 700 }}>All Forms</span>}
                        style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
                        styles={{ body: { padding: 0 } }}
                    >
                        <Table
                            dataSource={forms}
                            columns={columns}
                            rowKey="id"
                            size="middle"
                            pagination={false}
                            locale={{
                                emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No forms yet." />,
                            }}
                            style={{ borderRadius: 12, overflow: 'hidden' }}
                        />
                    </Card>

                </Spin>
            </div>
        </AuthLayout>
    );
}
