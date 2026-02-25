@extends('legal')

@section('title', 'Privacy Policy')

@section('content')
<h1>Privacy Policy</h1>
<p class="meta">Last updated: {{ date('F j, Y') }}</p>

<p>
    PromptForm ("we", "us", or "our") is a Shopify application that allows merchants to create
    AI-powered forms and collect responses from their store visitors. This Privacy Policy explains
    what data we collect, how we use it, and your rights regarding that data.
</p>

<h2>1. Data We Collect</h2>
<p>We collect and process the following categories of data:</p>
<ul>
    <li><strong>Merchant account data</strong> — Shopify store domain, OAuth access token (encrypted at rest), billing plan and subscription status.</li>
    <li><strong>Form definitions</strong> — Form titles, field schemas, styles, and settings created by merchants.</li>
    <li><strong>Form responses</strong> — Data submitted by end-customers through forms embedded on merchant storefronts. This may include names, email addresses, phone numbers, or other fields merchants configure.</li>
    <li><strong>Usage metadata</strong> — Hashed (non-reversible) IP addresses and browser user agents attached to form submissions for spam prevention. We do not store raw IP addresses.</li>
    <li><strong>AI generation logs</strong> — Records of AI-generated form schemas (prompt text, token counts) to enforce plan usage limits.</li>
</ul>

<h2>2. How We Use Your Data</h2>
<ul>
    <li>To provide and operate the PromptForm service.</li>
    <li>To generate form schemas via OpenAI's API using prompts you provide.</li>
    <li>To enforce plan limits (number of forms, submissions, and AI tokens).</li>
    <li>To process billing via Shopify's Billing API.</li>
    <li>To respond to GDPR data requests from Shopify on behalf of merchants.</li>
</ul>

<h2>3. Third-Party Services</h2>
<p>We share data with the following third parties to operate the service:</p>
<ul>
    <li><strong>Shopify</strong> — OAuth authentication, billing, and the Shopify Admin API. <a href="https://www.shopify.com/legal/privacy" target="_blank">Shopify Privacy Policy</a>.</li>
    <li><strong>OpenAI</strong> — Form prompts are sent to OpenAI's API to generate form schemas. We do not send personal data of end-customers to OpenAI. <a href="https://openai.com/policies/privacy-policy" target="_blank">OpenAI Privacy Policy</a>.</li>
</ul>
<p>We do not sell personal data to any third party.</p>

<h2>4. Data Retention</h2>
<ul>
    <li>Form responses are retained as long as the merchant's account is active and until explicitly deleted by the merchant.</li>
    <li>When a merchant uninstalls PromptForm, OAuth tokens are immediately revoked and billing is cancelled.</li>
    <li>All remaining shop data (forms, responses, AI logs) is permanently deleted within 48 hours of uninstall, upon receipt of Shopify's <code>shop/redact</code> webhook.</li>
</ul>

<h2>5. GDPR and Your Rights</h2>
<p>If you are located in the European Economic Area (EEA), you have rights including:</p>
<ul>
    <li>The right to access personal data we hold about you.</li>
    <li>The right to request correction or deletion of your personal data.</li>
    <li>The right to object to or restrict processing.</li>
    <li>The right to data portability.</li>
</ul>
<p>
    Merchants can manage and delete form responses directly within the PromptForm admin dashboard.
    To exercise any data rights, contact us at <a href="mailto:privacy@mesh99.com">privacy@mesh99.com</a>.
</p>

<h2>6. Security</h2>
<p>
    We store all data in encrypted databases. Shopify OAuth tokens are stored in a dedicated
    column separate from any user authentication system. Hashed IPs use a one-way SHA-256 hash
    that cannot be reversed. Access to production systems is restricted to authorised personnel only.
</p>

<h2>7. Cookies</h2>
<p>
    The PromptForm admin interface is a Shopify embedded app and does not set any first-party
    cookies beyond those required by Shopify's session management. The storefront widget does not
    set any cookies.
</p>

<h2>8. Changes to This Policy</h2>
<p>
    We may update this Privacy Policy from time to time. When we do, we will update the
    "Last updated" date at the top. Continued use of the app after changes constitutes
    acceptance of the updated policy.
</p>

<h2>9. Contact</h2>
<p>
    For privacy-related enquiries or data requests, contact us at:<br>
    <a href="mailto:privacy@mesh99.com">privacy@mesh99.com</a>
</p>
@endsection
