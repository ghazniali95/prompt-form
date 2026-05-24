import React, { useState } from 'react';
import {
    Avatar, Button, Card, Col, Divider, Form, Input,
    Row, Tag, Typography, message,
} from 'antd';
import {
    UserOutlined, MailOutlined, LockOutlined,
    EditOutlined, SaveOutlined, CrownOutlined, CalendarOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import AuthLayout from '@layouts/AuthLayout';

const { Title, Text } = Typography;

function InfoRow({ icon, label, value }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f8f8f8' }}>
            <div style={{ width: 32, color: '#bbb', flexShrink: 0 }}>
                {React.cloneElement(icon, { style: { fontSize: 16 } })}
            </div>
            <div>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                    {label}
                </Text>
                <Text style={{ fontSize: 14 }}>{value ?? '—'}</Text>
            </div>
        </div>
    );
}

export default function Profile({ user }) {
    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [editingProfile, setEditingProfile] = useState(false);

    const initials = user?.name?.[0]?.toUpperCase() ?? '?';
    const plan = user?.plan ?? 'Free';

    const handleSaveProfile = async () => {
        try {
            const values = await profileForm.validateFields();
            setSavingProfile(true);
            await axios.patch('/api/v1/profile', values);
            message.success('Profile updated.');
            setEditingProfile(false);
        } catch (err) {
            if (err.response) {
                message.error(err.response?.data?.message ?? 'Failed to update profile.');
            }
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSavePassword = async () => {
        try {
            const values = await passwordForm.validateFields();
            if (values.new_password !== values.confirm_password) {
                message.error('New passwords do not match.');
                return;
            }
            setSavingPassword(true);
            await axios.patch('/api/v1/profile/password', values);
            message.success('Password updated.');
            passwordForm.resetFields();
        } catch (err) {
            if (err.response) {
                message.error(err.response?.data?.message ?? 'Failed to update password.');
            }
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <AuthLayout user={user}>
            <div style={{ padding: '40px', maxWidth: 860 }}>

                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <Title level={3} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>
                        Account
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        Manage your profile, password, and account settings.
                    </Text>
                </div>

                <Row gutter={[20, 20]}>

                    {/* Left: Profile summary */}
                    <Col xs={24} md={8}>
                        <Card style={{ borderRadius: 14, border: '1px solid #f0f0f0', textAlign: 'center' }} styles={{ body: { padding: '32px 24px' } }}>
                            <Avatar
                                size={72}
                                style={{ background: '#f97316', fontWeight: 800, fontSize: 28, marginBottom: 16 }}
                            >
                                {initials}
                            </Avatar>
                            <Title level={5} style={{ fontWeight: 700, marginBottom: 4 }}>{user?.name}</Title>
                            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
                                {user?.email}
                            </Text>
                            <Tag
                                icon={plan !== 'Free' ? <CrownOutlined /> : null}
                                color={plan === 'Free' ? 'default' : 'orange'}
                                style={{ fontWeight: 600, borderRadius: 6 }}
                            >
                                {plan} Plan
                            </Tag>

                            <Divider style={{ margin: '20px 0' }} />

                            <InfoRow icon={<CalendarOutlined />} label="Member since" value={user?.created_at} />
                        </Card>
                    </Col>

                    {/* Right: Edit forms */}
                    <Col xs={24} md={16}>

                        {/* Profile info */}
                        <Card
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700 }}>Profile Information</span>
                                    {!editingProfile && (
                                        <Button
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => {
                                                profileForm.setFieldsValue({ name: user?.name, email: user?.email });
                                                setEditingProfile(true);
                                            }}
                                        >
                                            Edit
                                        </Button>
                                    )}
                                </div>
                            }
                            style={{ borderRadius: 14, border: '1px solid #f0f0f0', marginBottom: 16 }}
                            styles={{ body: { padding: '20px 24px' } }}
                        >
                            {editingProfile ? (
                                <Form form={profileForm} layout="vertical">
                                    <Form.Item
                                        label="Full name"
                                        name="name"
                                        rules={[{ required: true, message: 'Name is required.' }]}
                                    >
                                        <Input
                                            prefix={<UserOutlined style={{ color: '#bbb' }} />}
                                            size="large"
                                            style={{ borderRadius: 8 }}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        label="Email address"
                                        name="email"
                                        rules={[
                                            { required: true, message: 'Email is required.' },
                                            { type: 'email', message: 'Please enter a valid email.' },
                                        ]}
                                    >
                                        <Input
                                            prefix={<MailOutlined style={{ color: '#bbb' }} />}
                                            size="large"
                                            style={{ borderRadius: 8 }}
                                        />
                                    </Form.Item>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <Button
                                            type="primary"
                                            icon={<SaveOutlined />}
                                            loading={savingProfile}
                                            onClick={handleSaveProfile}
                                            style={{ fontWeight: 700 }}
                                        >
                                            Save Changes
                                        </Button>
                                        <Button onClick={() => setEditingProfile(false)} disabled={savingProfile}>
                                            Cancel
                                        </Button>
                                    </div>
                                </Form>
                            ) : (
                                <div>
                                    <InfoRow icon={<UserOutlined />} label="Full name" value={user?.name} />
                                    <InfoRow icon={<MailOutlined />} label="Email address" value={user?.email} />
                                </div>
                            )}
                        </Card>

                        {/* Change password */}
                        <Card
                            title={<span style={{ fontWeight: 700 }}>Change Password</span>}
                            style={{ borderRadius: 14, border: '1px solid #f0f0f0', marginBottom: 16 }}
                            styles={{ body: { padding: '20px 24px' } }}
                        >
                            <Form form={passwordForm} layout="vertical">
                                <Form.Item
                                    label="Current password"
                                    name="current_password"
                                    rules={[{ required: true, message: 'Please enter your current password.' }]}
                                >
                                    <Input.Password
                                        prefix={<LockOutlined style={{ color: '#bbb' }} />}
                                        size="large"
                                        style={{ borderRadius: 8 }}
                                    />
                                </Form.Item>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="New password"
                                            name="new_password"
                                            rules={[
                                                { required: true, message: 'New password is required.' },
                                                { min: 8, message: 'At least 8 characters.' },
                                            ]}
                                        >
                                            <Input.Password size="large" style={{ borderRadius: 8 }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Confirm new password"
                                            name="confirm_password"
                                            rules={[{ required: true, message: 'Please confirm your password.' }]}
                                        >
                                            <Input.Password size="large" style={{ borderRadius: 8 }} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Button
                                    type="primary"
                                    icon={<LockOutlined />}
                                    loading={savingPassword}
                                    onClick={handleSavePassword}
                                    style={{ fontWeight: 700 }}
                                >
                                    Update Password
                                </Button>
                            </Form>
                        </Card>

                        {/* Danger zone */}
                        <Card
                            title={<span style={{ fontWeight: 700, color: '#ef4444' }}>Danger Zone</span>}
                            style={{ borderRadius: 14, border: '1px solid #fee2e2' }}
                            styles={{ body: { padding: '20px 24px' } }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <Text strong style={{ display: 'block', fontSize: 14 }}>Delete account</Text>
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        Permanently delete your account and all associated data. This cannot be undone.
                                    </Text>
                                </div>
                                <Button
                                    danger
                                    onClick={() => message.warning('Please contact support to delete your account.')}
                                    style={{ flexShrink: 0, marginLeft: 16 }}
                                >
                                    Delete Account
                                </Button>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        </AuthLayout>
    );
}
