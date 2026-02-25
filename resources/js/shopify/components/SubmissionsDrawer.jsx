import React, { useState, useEffect } from 'react';
import { Text, Spinner, BlockStack } from '@shopify/polaris';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

const VISIBLE_FIELDS = 5;

function formatValue(val) {
    if (val === null || val === undefined || val === '') return '—';
    if (Array.isArray(val)) return val.join(', ');
    return String(val);
}

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            backgroundColor: 'var(--p-color-bg-surface, #fff)',
            border: '1px solid var(--p-color-border-subdued, #e4e5e7)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
            <div style={{ color: '#6b7280', marginBottom: 2 }}>
                {new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <div style={{ fontWeight: 600, color: '#202223' }}>
                {payload[0].value} submission{payload[0].value !== 1 ? 's' : ''}
            </div>
        </div>
    );
}

function SubmissionsTable({ responses, fields }) {
    const [expandedRows, setExpandedRows] = useState({});
    const hasMore = fields.length > VISIBLE_FIELDS;
    const visibleFields = hasMore ? fields.slice(0, VISIBLE_FIELDS) : fields;

    const toggleRow = (id) => setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

    const thStyle = {
        textAlign: 'left',
        padding: '10px 12px',
        color: '#6b7280',
        fontWeight: 500,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
        whiteSpace: 'nowrap',
        borderBottom: '2px solid var(--p-color-border-subdued, #e4e5e7)',
    };

    const tdStyle = {
        padding: '10px 12px',
        fontSize: 13,
        color: '#202223',
        borderBottom: '1px solid #f3f4f6',
        maxWidth: 180,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    };

    return (
        <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--p-color-border-subdued, #e4e5e7)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                    <tr>
                        <th style={thStyle}>Date</th>
                        {visibleFields.map((f) => (
                            <th key={f.id} style={thStyle}>{f.label}</th>
                        ))}
                        {hasMore && <th style={{ ...thStyle, width: 44 }} />}
                    </tr>
                </thead>
                <tbody>
                    {responses.map((response) => (
                        <React.Fragment key={response.id}>
                            <tr style={{ backgroundColor: expandedRows[response.id] ? '#f9fafb' : 'transparent' }}>
                                <td style={{ ...tdStyle, color: '#6b7280', fontSize: 12, whiteSpace: 'nowrap' }}>
                                    {new Date(response.submitted_at).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric', year: 'numeric',
                                    })}
                                </td>
                                {visibleFields.map((f) => (
                                    <td key={f.id} style={tdStyle}>
                                        {formatValue(response.data?.[f.id])}
                                    </td>
                                ))}
                                {hasMore && (
                                    <td style={{ ...tdStyle, textAlign: 'center', padding: '10px 8px' }}>
                                        <button
                                            onClick={() => toggleRow(response.id)}
                                            title={expandedRows[response.id] ? 'Collapse' : 'Expand all fields'}
                                            style={{
                                                background: 'none',
                                                border: '1px solid #e4e5e7',
                                                borderRadius: 4,
                                                cursor: 'pointer',
                                                padding: '2px 6px',
                                                color: '#5C6AC4',
                                                fontSize: 11,
                                                lineHeight: 1.5,
                                                transition: 'background 0.15s',
                                            }}
                                        >
                                            {expandedRows[response.id] ? '▲' : '▼'}
                                        </button>
                                    </td>
                                )}
                            </tr>

                            {hasMore && expandedRows[response.id] && (
                                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid var(--p-color-border-subdued, #e4e5e7)' }}>
                                    <td colSpan={visibleFields.length + 2} style={{ padding: '16px 16px 20px' }}>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                            gap: '14px 24px',
                                        }}>
                                            {fields.map((f) => (
                                                <div key={f.id}>
                                                    <div style={{ fontSize: 11, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>
                                                        {f.label}
                                                    </div>
                                                    <div style={{ fontSize: 13, color: '#202223' }}>
                                                        {formatValue(response.data?.[f.id]) || '—'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function SubmissionsDrawer({ form, api }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!form?.id) return;
        setLoading(true);
        setData(null);
        api.get(`/api/shopify/forms/${form.id}/responses`)
            .then(({ data: res }) => setData(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [form?.id]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
                <Spinner />
            </div>
        );
    }

    if (!data) return null;

    const fields = form?.schema?.fields || [];
    const hasAnyData = data.graph.some((d) => d.count > 0);

    return (
        <BlockStack gap="600">
            {/* Total count */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: 40, fontWeight: 700, lineHeight: 1, color: '#202223' }}>
                    {data.total}
                </span>
                <Text variant="bodyMd" tone="subdued">total submissions</Text>
            </div>

            {/* Line chart */}
            <div>
                <Text variant="headingSm" as="h3">Last 30 days</Text>
                <div style={{ marginTop: 12, height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.graph} margin={{ top: 4, right: 12, bottom: 0, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                tickFormatter={(val) => {
                                    const d = new Date(val + 'T00:00:00');
                                    return `${d.getMonth() + 1}/${d.getDate()}`;
                                }}
                                interval={4}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                allowDecimals={false}
                                axisLine={false}
                                tickLine={false}
                                width={28}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e4e5e7', strokeWidth: 1 }} />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#5C6AC4"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, fill: '#5C6AC4', stroke: '#fff', strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Table */}
            <div>
                <div style={{ marginBottom: 12 }}>
                    <Text variant="headingSm" as="h3">All submissions</Text>
                </div>
                {data.responses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
                        <Text tone="subdued">No submissions yet.</Text>
                    </div>
                ) : (
                    <SubmissionsTable responses={data.responses} fields={fields} />
                )}
            </div>
        </BlockStack>
    );
}
