import React from 'react';
import { Layout, Typography } from 'antd';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Link } = Typography;

const HEADER_STYLE = {
    background: '#fff',
    borderBottom: '1px solid #e8e8e8',
    padding: '0 40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

const CONTENT_STYLE = {
    maxWidth: 760,
    margin: '48px auto',
    padding: '0 24px 80px',
    width: '100%',
};

const FOOTER_STYLE = {
    textAlign: 'center',
    fontSize: 13,
    color: '#aaa',
    borderTop: '1px solid #e8e8e8',
    background: '#fff',
    padding: '20px 24px',
};

export default function Terms() {
    return (
        <Layout style={{ minHeight: '100vh', background: '#fff' }}>
            <Header style={HEADER_STYLE}>
                <img src="/images/logo.png" alt="PromptForm" style={{ height: 34 }} />
            </Header>

            <Content>
                <div style={CONTENT_STYLE}>
                    <Title style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Terms of Service</Title>
                    <Paragraph style={{ color: '#6b7280', fontSize: 14, marginBottom: 40 }}>
                        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </Paragraph>

                    <Paragraph>
                        These Terms of Service ("Terms") govern your use of PromptForm, a Shopify application
                        operated by Mesh99 ("we", "us", or "our"). By installing or using PromptForm, you agree
                        to these Terms.
                    </Paragraph>

                    <section>
                        <Title level={2}>1. Description of Service</Title>
                        <Paragraph>
                            PromptForm allows Shopify merchants to create AI-powered forms using natural language prompts,
                            embed those forms on their storefronts, and collect and review customer responses. The app uses
                            OpenAI's API to generate form schemas based on merchant-provided prompts.
                        </Paragraph>
                    </section>

                    <section>
                        <Title level={2}>2. Eligibility</Title>
                        <Paragraph>
                            You must have an active Shopify store and agree to Shopify's{' '}
                            <Link href="https://www.shopify.com/legal/terms" target="_blank">Terms of Service</Link>{' '}
                            to use PromptForm. You must be at least 18 years old to use this service.
                        </Paragraph>
                    </section>

                    <section>
                        <Title level={2}>3. Acceptable Use</Title>
                        <Paragraph>You agree not to use PromptForm to:</Paragraph>
                        <ul>
                            <li>Collect data from customers without appropriate disclosure or consent.</li>
                            <li>Create forms that collect sensitive personal data (health, financial, government ID) without proper legal basis.</li>
                            <li>Violate any applicable laws including GDPR, CCPA, or consumer protection regulations.</li>
                            <li>Attempt to reverse-engineer, scrape, or abuse the service.</li>
                            <li>Send spam or unsolicited communications using data collected via forms.</li>
                        </ul>
                    </section>

                    <section>
                        <Title level={2}>4. Billing and Subscriptions</Title>
                        <ul>
                            <li>PromptForm offers a free tier and paid plans (Starter and Growing), billed monthly through Shopify's Billing API.</li>
                            <li>Charges appear on your Shopify invoice and are subject to Shopify's billing terms.</li>
                            <li>You may cancel your subscription at any time from within the app. Cancellation takes effect at the end of the current billing period.</li>
                            <li>We reserve the right to change plan pricing with 30 days' notice.</li>
                        </ul>
                    </section>

                    <section>
                        <Title level={2}>5. Data and Privacy</Title>
                        <Paragraph>
                            Your use of PromptForm is also governed by our{' '}
                            <Link href="/privacy-policy">Privacy Policy</Link>, which is incorporated into these Terms
                            by reference. You are responsible for ensuring your use of collected customer data complies
                            with all applicable privacy laws and your own privacy policy.
                        </Paragraph>
                    </section>

                    <section>
                        <Title level={2}>6. Intellectual Property</Title>
                        <Paragraph>
                            All rights in the PromptForm application, including the codebase, UI, and brand, are owned by
                            Mesh99. Form schemas and customer response data you create through the app remain your property.
                            We do not claim ownership over your content.
                        </Paragraph>
                    </section>

                    <section>
                        <Title level={2}>7. AI-Generated Content</Title>
                        <Paragraph>
                            Form schemas are generated using OpenAI's GPT models. We do not guarantee the accuracy,
                            completeness, or suitability of AI-generated output. You are responsible for reviewing and
                            validating all forms before publishing them to your storefront.
                        </Paragraph>
                    </section>

                    <section>
                        <Title level={2}>8. Service Availability</Title>
                        <Paragraph>
                            We aim for high availability but do not guarantee uninterrupted service. We are not liable for
                            downtime caused by Shopify, OpenAI, or infrastructure providers. We reserve the right to
                            modify or discontinue the service with reasonable notice.
                        </Paragraph>
                    </section>

                    <section>
                        <Title level={2}>9. Limitation of Liability</Title>
                        <Paragraph>
                            To the maximum extent permitted by law, Mesh99 shall not be liable for any indirect, incidental,
                            special, or consequential damages arising from your use of PromptForm, including but not limited
                            to loss of data, revenue, or business opportunity. Our total liability for any claim shall not
                            exceed the fees you paid in the 3 months preceding the claim.
                        </Paragraph>
                    </section>

                    <section>
                        <Title level={2}>10. Termination</Title>
                        <Paragraph>
                            We reserve the right to suspend or terminate your access to PromptForm if you violate these
                            Terms or engage in activity that is harmful to other users, Shopify, or Mesh99. Upon
                            termination, your data will be deleted in accordance with our Privacy Policy.
                        </Paragraph>
                    </section>

                    <section>
                        <Title level={2}>11. Governing Law</Title>
                        <Paragraph>
                            These Terms are governed by the laws of the jurisdiction in which Mesh99 operates, without
                            regard to conflict of law principles.
                        </Paragraph>
                    </section>

                    <section>
                        <Title level={2}>12. Changes to Terms</Title>
                        <Paragraph>
                            We may update these Terms from time to time. Continued use of the app after changes
                            constitutes acceptance of the updated Terms.
                        </Paragraph>
                    </section>

                    <section>
                        <Title level={2}>13. Contact</Title>
                        <Paragraph>
                            For any questions regarding these Terms, contact us at:{' '}
                            <Link href="mailto:legal@mesh99.com">legal@mesh99.com</Link>
                        </Paragraph>
                    </section>
                </div>
            </Content>

            <Footer style={FOOTER_STYLE}>
                <Link href="/privacy-policy" style={{ color: '#aaa' }}>Privacy Policy</Link>
                &nbsp;·&nbsp;
                <Link href="/terms" style={{ color: '#aaa' }}>Terms of Service</Link>
                &nbsp;·&nbsp;
                © {new Date().getFullYear()} PromptForm
            </Footer>
        </Layout>
    );
}
