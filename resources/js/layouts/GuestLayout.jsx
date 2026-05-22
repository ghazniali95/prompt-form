import React from 'react';
import { Layout } from 'antd';

const { Content, Footer } = Layout;

export default function GuestLayout({ children }) {
    return (
        <Layout style={{ minHeight: '100vh', background: '#ffffff' }}>
            <Content style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 24px',
            }}>
                {children}
            </Content>

            <Footer style={{
                textAlign: 'center',
                fontSize: 13,
                color: '#aaa',
                borderTop: '1px solid #e8e8e8',
                background: '#fff',
                padding: '20px 24px',
            }}>
                © {new Date().getFullYear()} PromptForm &nbsp;·&nbsp;
                <a href="/privacy-policy" style={{ color: '#aaa' }}>Privacy Policy</a>
                &nbsp;·&nbsp;
                <a href="/terms" style={{ color: '#aaa' }}>Terms of Service</a>
            </Footer>
        </Layout>
    );
}
