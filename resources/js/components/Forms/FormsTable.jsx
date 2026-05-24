import React, { useState } from 'react';
import {
    Button, Table, Tag, Typography, Dropdown, Modal, Input, message,
} from 'antd';
import {
    EditOutlined, DeleteOutlined, MoreOutlined, CopyOutlined,
    CheckCircleOutlined, ClockCircleOutlined, FontSizeOutlined, CodeOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Text } = Typography;

// ── Embed modal helpers ───────────────────────────────────────────────────────

function CodeSnippet({ code, onCopy }) {
    return (
        <div style={{ position: 'relative', background: '#0f172a', borderRadius: 8, padding: '12px 16px', marginTop: 8 }}>
            <pre style={{
                margin: 0, fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                fontSize: 12.5, color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.6,
            }}>
                {code}
            </pre>
            <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={onCopy}
                style={{ position: 'absolute', top: 8, right: 8, background: '#1e293b', borderColor: '#334155', color: '#94a3b8' }}
            >
                Copy
            </Button>
        </div>
    );
}

function EmbedModal({ open, form, onClose }) {
    if (!form) return null;

    const scriptTag  = `<script src="${window.location.origin}/embed.js"></script>`;
    const divSnippet = `<div data-pf-form="${form.ulid}"></div>`;

    const copy = (text, label) =>
        navigator.clipboard.writeText(text)
            .then(() => message.success(`${label} copied!`))
            .catch(() => message.error('Copy failed.'));

    const steps = [
        {
            num: '1',
            title: 'Add this script to your page <head> — once per site',
            note: 'You only need this once, even if you embed multiple forms.',
            code: scriptTag,
            label: 'Script tag',
        },
        {
            num: '2',
            title: 'Place this div wherever you want the form to appear',
            note: 'You can drop it multiple times on the same page.',
            code: divSnippet,
            label: 'Div snippet',
        },
    ];

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={<Button onClick={onClose}>Close</Button>}
            width={580}
            destroyOnHidden
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f974161a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CodeOutlined style={{ fontSize: 18, color: '#f97316' }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>Embed Form</div>
                        <div style={{ fontWeight: 400, fontSize: 12, color: '#999', marginTop: 2 }}>{form.title}</div>
                    </div>
                </div>
            }
        >
            <div style={{ padding: '16px 0 4px', display: 'flex', flexDirection: 'column', gap: 24 }}>

                {form.status !== 'published' && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e' }}>
                        This form is a <strong>draft</strong>. Publish it first — it won't display until published.
                    </div>
                )}

                {steps.map(step => (
                    <div key={step.num}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
                            <div style={{
                                minWidth: 22, height: 22, borderRadius: '50%', background: '#f97316',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 700, color: '#fff', marginTop: 1,
                            }}>
                                {step.num}
                            </div>
                            <div>
                                <Text strong style={{ fontSize: 13 }}>{step.title}</Text>
                                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>{step.note}</Text>
                            </div>
                        </div>
                        <CodeSnippet code={step.code} onCopy={() => copy(step.code, step.label)} />
                    </div>
                ))}

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px', fontSize: 12.5, color: '#64748b', lineHeight: 1.6 }}>
                    <Text strong style={{ fontSize: 12.5, color: '#475569', display: 'block', marginBottom: 4 }}>How it works</Text>
                    The script finds all <code style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: 4 }}>data-pf-form</code> elements on the page and renders your form inside them. Works on any website — WordPress, Webflow, plain HTML — no framework required.
                </div>
            </div>
        </Modal>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FormsTable({
    forms,
    loading        = false,
    pagination     = false,
    emptyText      = null,
    onEditWithAI,
    onFormUpdated,
    onFormDeleted,
}) {
    const [renameModal, setRenameModal]     = useState({ open: false, form: null, value: '' });
    const [renameLoading, setRenameLoading] = useState(false);
    const [embedModal, setEmbedModal]       = useState({ open: false, form: null });

    const handleDelete = (record) => {
        Modal.confirm({
            title:   `Delete "${record.title}"?`,
            content: 'This will permanently delete the form and all its submissions. This cannot be undone.',
            okText:  'Delete',
            okType:  'danger',
            onOk: () =>
                axios.delete(`/api/v1/forms/${record.id}`)
                    .then(() => {
                        message.success('Form deleted.');
                        onFormDeleted?.(record.id);
                    })
                    .catch(() => message.error('Failed to delete form.')),
        });
    };

    const handleRename = async () => {
        const { form, value } = renameModal;
        const title = value.trim();
        if (!title || title === form.title) {
            setRenameModal({ open: false, form: null, value: '' });
            return;
        }
        setRenameLoading(true);
        try {
            await axios.patch(`/api/v1/forms/${form.id}`, { title });
            message.success('Form renamed.');
            onFormUpdated?.({ ...form, title });
            setRenameModal({ open: false, form: null, value: '' });
        } catch {
            message.error('Failed to rename form.');
        } finally {
            setRenameLoading(false);
        }
    };

    const handleTogglePublish = async (record) => {
        const endpoint = record.status === 'published'
            ? `/api/v1/forms/${record.id}/unpublish`
            : `/api/v1/forms/${record.id}/publish`;
        try {
            const { data } = await axios.post(endpoint);
            onFormUpdated?.(data.data);
        } catch {
            message.error('Failed to update form status.');
        }
    };

    const handleCopyId = (record) => {
        navigator.clipboard.writeText(record.ulid)
            .then(() => message.success('Form ID copied.'))
            .catch(() => message.error('Copy failed.'));
    };

    const rowActions = (record) => [
        {
            key: 'edit', icon: <EditOutlined />, label: 'Edit with AI',
            onClick: () => onEditWithAI?.(record),
        },
        {
            key: 'rename', icon: <FontSizeOutlined />, label: 'Rename',
            onClick: () => setRenameModal({ open: true, form: record, value: record.title }),
        },
        {
            key:     record.status === 'published' ? 'unpublish' : 'publish',
            icon:    record.status === 'published' ? <ClockCircleOutlined /> : <CheckCircleOutlined />,
            label:   record.status === 'published' ? 'Unpublish' : 'Publish',
            onClick: () => handleTogglePublish(record),
        },
        {
            key: 'copy', icon: <CopyOutlined />, label: 'Copy Form ID',
            onClick: () => handleCopyId(record),
        },
        {
            key: 'embed', icon: <CodeOutlined />, label: 'Embed',
            onClick: () => setEmbedModal({ open: true, form: record }),
        },
        { type: 'divider' },
        {
            key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true,
            onClick: () => handleDelete(record),
        },
    ];

    const columns = [
        {
            title:  'Form',
            key:    'title',
            render: (_, record) => (
                <div>
                    <Text strong style={{ fontSize: 14 }}>{record.title}</Text>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                        ID: {record.ulid?.slice(-8) ?? record.id}
                    </Text>
                </div>
            ),
        },
        {
            title:  'Status',
            key:    'status',
            width:  130,
            render: (_, r) => r.status === 'published'
                ? <Tag color="success" icon={<CheckCircleOutlined />}>Published</Tag>
                : <Tag color="default" icon={<ClockCircleOutlined />}>Draft</Tag>,
        },
        {
            title:  'Views',
            key:    'views',
            width:  90,
            align:  'right',
            render: (_, r) => <Text>{(r.views ?? 0).toLocaleString()}</Text>,
        },
        {
            title:  'Submissions',
            key:    'submissions',
            width:  120,
            align:  'right',
            render: (_, r) => (
                <Text strong style={{ color: (r.submissions ?? 0) > 0 ? '#f97316' : '#bbb' }}>
                    {(r.submissions ?? 0).toLocaleString()}
                </Text>
            ),
        },
        {
            title:  'Last Updated',
            key:    'updated_at',
            width:  140,
            render: (_, r) => (
                <Text type="secondary" style={{ fontSize: 13 }}>
                    {r.updated_at?.slice(0, 10) ?? '—'}
                </Text>
            ),
        },
        {
            title:  '',
            key:    'actions',
            width:  48,
            render: (_, record) => (
                <Dropdown menu={{ items: rowActions(record) }} trigger={['click']} placement="bottomRight">
                    <Button type="text" icon={<MoreOutlined />} style={{ color: '#aaa' }} />
                </Dropdown>
            ),
        },
    ];

    return (
        <>
            <Table
                dataSource={forms}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={pagination}
                locale={emptyText ? { emptyText } : undefined}
                style={{ borderRadius: 12, overflow: 'hidden' }}
            />

            {/* Rename modal */}
            <Modal
                open={renameModal.open}
                onCancel={() => setRenameModal({ open: false, form: null, value: '' })}
                title="Rename form"
                footer={[
                    <Button key="cancel" onClick={() => setRenameModal({ open: false, form: null, value: '' })} disabled={renameLoading}>Cancel</Button>,
                    <Button key="save" type="primary" loading={renameLoading} disabled={!renameModal.value.trim()} onClick={handleRename} style={{ fontWeight: 700 }}>Save</Button>,
                ]}
                width={440}
                destroyOnHidden
            >
                <div style={{ padding: '20px 0 8px' }}>
                    <Input
                        autoFocus
                        size="large"
                        value={renameModal.value}
                        onChange={e => setRenameModal(prev => ({ ...prev, value: e.target.value }))}
                        onPressEnter={handleRename}
                        maxLength={255}
                        style={{ borderRadius: 10 }}
                    />
                </div>
            </Modal>

            {/* Embed modal */}
            <EmbedModal
                open={embedModal.open}
                form={embedModal.form}
                onClose={() => setEmbedModal({ open: false, form: null })}
            />
        </>
    );
}
