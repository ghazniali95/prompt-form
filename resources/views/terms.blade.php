@extends('legal')

@section('title', 'Terms of Service')

@section('content')
<h1>Terms of Service</h1>
<p class="meta">Last updated: {{ date('F j, Y') }}</p>

<p>
    These Terms of Service ("Terms") govern your use of Prompt Form, a Shopify application
    operated by Mesh99 ("we", "us", or "our"). By installing or using Prompt Form, you agree
    to these Terms.
</p>

<h2>1. Description of Service</h2>
<p>
    Prompt Form allows Shopify merchants to create AI-powered forms using natural language prompts,
    embed those forms on their storefronts, and collect and review customer responses. The app uses
    OpenAI's API to generate form schemas based on merchant-provided prompts.
</p>

<h2>2. Eligibility</h2>
<p>
    You must have an active Shopify store and agree to Shopify's
    <a href="https://www.shopify.com/legal/terms" target="_blank">Terms of Service</a> to use
    Prompt Form. You must be at least 18 years old to use this service.
</p>

<h2>3. Acceptable Use</h2>
<p>You agree not to use Prompt Form to:</p>
<ul>
    <li>Collect data from customers without appropriate disclosure or consent.</li>
    <li>Create forms that collect sensitive personal data (health, financial, government ID) without proper legal basis.</li>
    <li>Violate any applicable laws including GDPR, CCPA, or consumer protection regulations.</li>
    <li>Attempt to reverse-engineer, scrape, or abuse the service.</li>
    <li>Send spam or unsolicited communications using data collected via forms.</li>
</ul>

<h2>4. Billing and Subscriptions</h2>
<ul>
    <li>Prompt Form offers a free tier and paid plans (Starter and Growing), billed monthly through Shopify's Billing API.</li>
    <li>Charges appear on your Shopify invoice and are subject to Shopify's billing terms.</li>
    <li>You may cancel your subscription at any time from within the app. Cancellation takes effect at the end of the current billing period.</li>
    <li>We reserve the right to change plan pricing with 30 days' notice.</li>
</ul>

<h2>5. Data and Privacy</h2>
<p>
    Your use of Prompt Form is also governed by our
    <a href="/privacy-policy">Privacy Policy</a>, which is incorporated into these Terms by reference.
    You are responsible for ensuring your use of collected customer data complies with all applicable
    privacy laws and your own privacy policy.
</p>

<h2>6. Intellectual Property</h2>
<p>
    All rights in the Prompt Form application, including the codebase, UI, and brand, are owned by
    Mesh99. Form schemas and customer response data you create through the app remain your property.
    We do not claim ownership over your content.
</p>

<h2>7. AI-Generated Content</h2>
<p>
    Form schemas are generated using OpenAI's GPT models. We do not guarantee the accuracy,
    completeness, or suitability of AI-generated output. You are responsible for reviewing and
    validating all forms before publishing them to your storefront.
</p>

<h2>8. Service Availability</h2>
<p>
    We aim for high availability but do not guarantee uninterrupted service. We are not liable for
    downtime caused by Shopify, OpenAI, or infrastructure providers. We reserve the right to
    modify or discontinue the service with reasonable notice.
</p>

<h2>9. Limitation of Liability</h2>
<p>
    To the maximum extent permitted by law, Mesh99 shall not be liable for any indirect, incidental,
    special, or consequential damages arising from your use of Prompt Form, including but not limited
    to loss of data, revenue, or business opportunity. Our total liability for any claim shall not
    exceed the fees you paid in the 3 months preceding the claim.
</p>

<h2>10. Termination</h2>
<p>
    We reserve the right to suspend or terminate your access to Prompt Form if you violate these
    Terms or engage in activity that is harmful to other users, Shopify, or Mesh99. Upon
    termination, your data will be deleted in accordance with our Privacy Policy.
</p>

<h2>11. Governing Law</h2>
<p>
    These Terms are governed by the laws of the jurisdiction in which Mesh99 operates, without
    regard to conflict of law principles.
</p>

<h2>12. Changes to Terms</h2>
<p>
    We may update these Terms from time to time. Continued use of the app after changes
    constitutes acceptance of the updated Terms.
</p>

<h2>13. Contact</h2>
<p>
    For any questions regarding these Terms, contact us at:<br>
    <a href="mailto:legal@mesh99.com">legal@mesh99.com</a>
</p>
@endsection
