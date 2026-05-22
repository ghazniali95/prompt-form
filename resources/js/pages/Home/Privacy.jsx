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

export default function Privacy() {
    return (
        <Layout style={{ minHeight: '100vh', background: '#fff' }}>
            <Header style={HEADER_STYLE}>
                <img src="/images/logo.png" alt="PromptForm" style={{ height: 34 }} />
            </Header>

            <Content>
                <div style={CONTENT_STYLE}>
                    <Title style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Privacy Policy</Title>
                    <Paragraph style={{ color: '#6b7280', fontSize: 14, marginBottom: 40 }}>
                        Last updated: March 10, 2026
                    </Paragraph>

                    <section>
                        <Title level={2}>1. Overview</Title>
                        <Paragraph>
                            Prompt Form ("the App", "we", "us") is a Shopify application that allows merchants to create
                            AI-powered forms and embed them on their Shopify storefront. This Privacy Policy explains what
                            data we collect, how we use it, and how we protect it, in compliance with Shopify's Partner
                            Program Agreement and applicable privacy laws.
                        </Paragraph>
                    </section>

                    <section>
                        <Title level={2}>2. Data We Collect</Title>

                        <Title level={3}>2.1 Merchant Data (collected during installation and use)</Title>
                        <ul>
                            <li>Shop domain (e.g. mystore.myshopify.com)</li>
                            <li>Shopify OAuth access token — stored encrypted, used solely to make authorized API calls on the merchant's behalf</li>
                            <li>Billing information — managed exclusively through the Shopify Billing API; we do not store payment card details</li>
                            <li>App usage data — form configurations, AI generation prompts, tokens used, and version history</li>
                        </ul>

                        <Title level={3}>2.2 Storefront Visitor Data (collected when end customers submit forms)</Title>
                        <ul>
                            <li>Form submission data — field values submitted by the merchant's customers (content varies by form)</li>
                            <li>Metadata — hashed IP address, user agent string, and referrer URL, collected for spam prevention and analytics</li>
                        </ul>

                        <Title level={3}>2.3 AI Processing Data</Title>
                        <Paragraph>
                            Prompts entered by merchants to generate or refine form schemas are sent to OpenAI's API (GPT-4o)
                            for processing. Prompts and generated schemas are stored in our database for your form history.
                        </Paragraph>
                    </section>

                    <section>
                        <Title level={2}>3. How We Use Data</Title>
                        <ul>
                            <li>Shop domain &amp; access token — to authenticate API requests and deliver core app functionality</li>
                            <li>Form configurations — to render forms in the Shopify Admin and on your storefront</li>
                            <li>AI prompts &amp; schemas — to generate and refine form structures via OpenAI</li>
                            <li>Form submission data — to store and display responses to merchants</li>
                            <li>Hashed IP &amp; metadata — for rate limiting, spam detection, and analytics</li>
                            <li>Usage metrics — to enforce plan limits such as AI prompt usage per tier</li>
                        </ul>
                        <Paragraph>We do not sell, rent, or share merchant or customer data with third parties for advertising or marketing purposes.</Paragraph>
                    </section>

                    <section>
                        <Title level={2}>4. Third-Party Services</Title>
                        <ul>
                            <li><strong>Shopify</strong> — app platform, billing, and OAuth. We share your shop domain and access scopes.</li>
                            <li>
                                <strong>OpenAI</strong> — used for AI form generation. Only merchant-entered prompts are shared.
                                All data sent to OpenAI is subject to{' '}
                                <Link href="https://openai.com/privacy" target="_blank">OpenAI's Privacy Policy</Link>.
                                We use structured outputs and do not include personally identifiable customer information in AI prompts.
                            </li>
                            <li><strong>Redis / Laravel Horizon</strong> — used for async queue processing with temporary job payloads only.</li>
                        </ul>
                    </section>

                    <section>
                        <Title level={2}>5. Data Storage and Security</Title>
                        <ul>
                            <li>All data is stored in encrypted MySQL databases.</li>
                            <li>Shopify OAuth access tokens are encrypted at rest.</li>
                            <li>All data in transit is protected via TLS/SSL (HTTPS enforced on all endpoints).</li>
                            <li>Our storefront API uses ULID-based identifiers (not sequential IDs) to prevent enumeration attacks.</li>
                            <li>Access to production data is restricted to authorized personnel only.</li>
                        </ul>
                    </section>

                    <section>
                        <Title level={2}>6. GDPR Compliance</Title>
                        <Paragraph>Prompt Form implements all mandatory Shopify GDPR webhooks:</Paragraph>
                        <ul>
                            <li><strong>customers/data_request</strong> — We provide merchants with any stored customer data upon request.</li>
                            <li><strong>customers/redact</strong> — We delete customer submission data associated with a specific customer upon request.</li>
                            <li><strong>shop/redact</strong> — Upon app uninstallation and a 48-hour grace period, we permanently delete all shop data including forms, responses, AI generation history, and access tokens.</li>
                        </ul>
                        <Paragraph>
                            Merchants acting as data controllers are responsible for obtaining appropriate consent from their
                            customers before collecting data through forms embedded on their storefront.
                        </Paragraph>
                    </section>

                    <section>
                        <Title level={2}>7. Data Retention</Title>
                        <ul>
                            <li>Shop data (forms, settings) — retained while the app is installed; deleted 48 hours after uninstall</li>
                            <li>Form submission responses — retained until the merchant deletes them or uninstalls the app</li>
                            <li>AI generation history — retained while the app is installed</li>
                            <li>Access tokens — deleted immediately upon app uninstall</li>
                        </ul>
                    </section>

                    <section>
                        <Title level={2}>8. Merchant Responsibilities</Title>
                        <Paragraph>Merchants using Prompt Form are responsible for:</Paragraph>
                        <ul>
                            <li>Informing their customers about what data is collected through forms on their storefront</li>
                            <li>Ensuring their use of the App complies with applicable privacy laws (GDPR, CCPA, etc.)</li>
                            <li>Configuring forms in a manner consistent with their own privacy policy</li>
                        </ul>
                    </section>

                    <section>
                        <Title level={2}>9. Children's Privacy</Title>
                        <Paragraph>
                            The App is intended for use by merchants and is not directed at individuals under the age of 13.
                            We do not knowingly collect personal data from children.
                        </Paragraph>
                    </section>

                    <section>
                        <Title level={2}>10. Changes to This Policy</Title>
                        <Paragraph>
                            We may update this Privacy Policy from time to time. When we do, we will update the "Last updated"
                            date at the top. Continued use of the App after changes constitutes acceptance of the updated policy.
                        </Paragraph>
                    </section>

                    <section>
                        <Title level={2}>11. Contact</Title>
                        <Paragraph>
                            For privacy-related questions or data requests, please contact us at:{' '}
                            <Link href="mailto:ghazniali95@gmail.com">ghazniali95@gmail.com</Link>
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
