@extends('legal')

@section('title', 'Privacy Policy')

@section('content')
<h1>Privacy Policy</h1>
<p class="meta">Last updated: March 10, 2026</p>

<h2>1. Overview</h2>
<p>
    Prompt Form ("the App", "we", "us") is a Shopify application that allows merchants to create AI-powered forms and embed them on their Shopify storefront. This Privacy Policy explains what data we collect, how we use it, and how we protect it, in compliance with Shopify's Partner Program Agreement and applicable privacy laws.
</p>

<h2>2. Data We Collect</h2>

<h3>2.1 Merchant Data (collected during installation and use)</h3>
<ul>
    <li>Shop domain (e.g. mystore.myshopify.com)</li>
    <li>Shopify OAuth access token — stored encrypted, used solely to make authorized API calls on the merchant's behalf</li>
    <li>Billing information — managed exclusively through the Shopify Billing API; we do not store payment card details</li>
    <li>App usage data — form configurations, AI generation prompts, tokens used, and version history</li>
</ul>

<h3>2.2 Storefront Visitor Data (collected when end customers submit forms)</h3>
<ul>
    <li>Form submission data — field values submitted by the merchant's customers (content varies by form)</li>
    <li>Metadata — hashed IP address, user agent string, and referrer URL, collected for spam prevention and analytics</li>
</ul>

<h3>2.3 AI Processing Data</h3>
<p>
    Prompts entered by merchants to generate or refine form schemas are sent to OpenAI's API (GPT-4o) for processing. Prompts and generated schemas are stored in our database for your form history.
</p>

<h2>3. How We Use Data</h2>
<ul>
    <li>Shop domain &amp; access token — to authenticate API requests and deliver core app functionality</li>
    <li>Form configurations — to render forms in the Shopify Admin and on your storefront</li>
    <li>AI prompts &amp; schemas — to generate and refine form structures via OpenAI</li>
    <li>Form submission data — to store and display responses to merchants</li>
    <li>Hashed IP &amp; metadata — for rate limiting, spam detection, and analytics</li>
    <li>Usage metrics — to enforce plan limits such as AI prompt usage per tier</li>
</ul>
<p>We do not sell, rent, or share merchant or customer data with third parties for advertising or marketing purposes.</p>

<h2>4. Third-Party Services</h2>
<ul>
    <li><strong>Shopify</strong> — app platform, billing, and OAuth. We share your shop domain and access scopes.</li>
    <li><strong>OpenAI</strong> — used for AI form generation. Only merchant-entered prompts are shared. All data sent to OpenAI is subject to <a href="https://openai.com/privacy" target="_blank">https://openai.com/privacy</a>. We use structured outputs and do not include personally identifiable customer information in AI prompts.</li>
    <li><strong>Redis / Laravel Horizon</strong> — used for async queue processing with temporary job payloads only.</li>
</ul>

<h2>5. Data Storage and Security</h2>
<ul>
    <li>All data is stored in encrypted MySQL databases.</li>
    <li>Shopify OAuth access tokens are encrypted at rest.</li>
    <li>All data in transit is protected via TLS/SSL (HTTPS enforced on all endpoints).</li>
    <li>Our storefront API uses ULID-based identifiers (not sequential IDs) to prevent enumeration attacks.</li>
    <li>Access to production data is restricted to authorized personnel only.</li>
</ul>

<h2>6. GDPR Compliance</h2>
<p>Prompt Form implements all mandatory Shopify GDPR webhooks:</p>
<ul>
    <li><strong>customers/data_request</strong> — We provide merchants with any stored customer data upon request.</li>
    <li><strong>customers/redact</strong> — We delete customer submission data associated with a specific customer upon request.</li>
    <li><strong>shop/redact</strong> — Upon app uninstallation and a 48-hour grace period, we permanently delete all shop data including forms, responses, AI generation history, and access tokens.</li>
</ul>
<p>Merchants acting as data controllers are responsible for obtaining appropriate consent from their customers before collecting data through forms embedded on their storefront.</p>

<h2>7. Data Retention</h2>
<ul>
    <li>Shop data (forms, settings) — retained while the app is installed; deleted 48 hours after uninstall</li>
    <li>Form submission responses — retained until the merchant deletes them or uninstalls the app</li>
    <li>AI generation history — retained while the app is installed</li>
    <li>Access tokens — deleted immediately upon app uninstall</li>
</ul>

<h2>8. Merchant Responsibilities</h2>
<p>Merchants using Prompt Form are responsible for:</p>
<ul>
    <li>Informing their customers about what data is collected through forms on their storefront</li>
    <li>Ensuring their use of the App complies with applicable privacy laws (GDPR, CCPA, etc.)</li>
    <li>Configuring forms in a manner consistent with their own privacy policy</li>
</ul>

<h2>9. Children's Privacy</h2>
<p>The App is intended for use by merchants and is not directed at individuals under the age of 13. We do not knowingly collect personal data from children.</p>

<h2>10. Changes to This Policy</h2>
<p>
    We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date at the top. Continued use of the App after changes constitutes acceptance of the updated policy.
</p>

<h2>11. Contact</h2>
<p>
    For privacy-related questions or data requests, please contact us at:<br>
    <a href="mailto:ghazniali95@gmail.com">ghazniali95@gmail.com</a>
</p>
@endsection
