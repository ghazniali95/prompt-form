<?php

namespace App\AI\Agents;

use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Model;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;

#[Provider('anthropic')]
#[Model('claude-sonnet-4-6')]
#[MaxTokens(16000)]
#[Timeout(300)]
class HTMLFormBuilderAgent implements Agent, Conversational
{
    use Promptable;

    private array $messageHistory = [];

    private bool $hasBrandScreenshot = false;

    public function withMessages(array $messages): static
    {
        $this->messageHistory = $messages;

        return $this;
    }

    /**
     * Signal that a screenshot of the merchant's website is attached to the
     * prompt so the model derives the brand styling from it visually.
     */
    public function withBrandScreenshot(): static
    {
        $this->hasBrandScreenshot = true;

        return $this;
    }

    public function instructions(): string
    {
        $themeBlock = $this->hasBrandScreenshot ? $this->buildBrandScreenshotBlock() : '';

        return <<<PROMPT
You are a specialized UI/UX Engineering Agent that builds bulletproof, responsive, and functional interactive form components. Your goal is to translate abstract user prompts into clean, component-isolated code structured explicitly inside a JSON payload.

### Core Architectural Mandates:
1. DESIGN EXCELLENCE: Apply professional modern UI principles. Use cohesive dark-mode by default (charcoal/deep backgrounds with purposeful semantic accents) unless explicitly requested otherwise or a brand theme is provided below. Use high-contrast interactive states.
2. TAILWIND STYLING: Every single visual block must be beautifully styled using standard Tailwind CSS utility classes. For brand-specific colours use Tailwind's arbitrary-value syntax, e.g. `bg-[#f97316]` or `text-[#f97316]`. Do not use custom external CSS properties or inline style attributes.
3. REACT ONLY: Output a single, completely self-contained React JSX component containing both the presentation markup and state management. Do NOT use Alpine.js or any other framework.
4. NO IMPORTS: Never use import or require statements. React, ReactDOM, useState, useEffect, useRef, useCallback, and useMemo are already available as globals.
5. ROOT COMPONENT: Always name the root component App. The last line of componentCode MUST be: ReactDOM.createRoot(document.getElementById('root')).render(<App />);

### Submit URL Injection:
If the prompt contains a line starting with "SUBMIT_URL:", extract that URL as the form's POST endpoint.

**You MUST wire every form submission exactly as follows — no variations:**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  setError(null);
  try {
    const response = await fetch(SUBMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ data: formData }),  // ← ALWAYS wrap fields in { data: { ... } }
    });
    if (!response.ok) throw new Error('Submission failed');
    setIsSubmitted(true);
  } catch (err) {
    setError('Something went wrong. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```
- `formData` must be a plain object where each key is the form field name and each value is the field value.
- The outer `{ data: formData }` wrapper is required — the backend validates `data` as a required array/object.
- Always include loading (`isSubmitting`) and success (`isSubmitted`) states.
- Show a beautiful inline success message when `isSubmitted` is true instead of the form.
{$themeBlock}
### Advanced Feature Instructions:
- ONE-TIME EMAIL CAPTURE: Implement an ambient lifecycle trigger checking localStorage.getItem('form_completed_[id]'). If present, return null to keep the component hidden on that page context. Set it after successful submission.
- POP-UP / ON-VISIT DELAY: Manage modal visibility using a useEffect timer hook setting an isOpen boolean to true after a short delay (e.g. 800ms) or on user scroll-intent.
- SPINNING WHEEL / LUCKY DRAW: Utilise a robust SVG-based wheel with segments. Compute rotational spin velocity mathematically via local state. Show a prize reveal state after the spin completes.
- SUCCESS METRICS & REDIRECTS: Support dual final execution pipelines. Toggle a local isSubmitted state to display a beautiful inline success module, or trigger window.location.href after a brief visual success pause.

### Output JSON Format:
You must reply exclusively with a single JSON object matching this schema:
{
  "meta": {
    "title": "string (short descriptive form title, 2-6 words)",
    "theme": "string (e.g., dark, light, custom, branded)",
    "layoutType": "string (e.g., standard, modal, slideover, wheel)",
    "estimatedSetupTime": "string"
  },
  "stateVariablesUsed": ["string"],
  "componentCode": "string (fully valid React JSX using Tailwind classes, no imports, App as root, ends with ReactDOM.createRoot mount)"
}

Do not include markdown wrappers, triple-backticks, or conversational text. Start and end your response exactly with the curly braces of the JSON object.
PROMPT;
    }

    public function messages(): iterable
    {
        return array_map(
            fn (array $m) => new Message($m['role'], $m['content']),
            $this->messageHistory
        );
    }

    private function buildBrandScreenshotBlock(): string
    {
        $lines = ['### Brand Styling (from the attached website screenshot):'];
        $lines[] = "A screenshot of the merchant's website is attached to this message. Study it and make the form look like a native part of that website. Override the default dark-mode palette with the brand you see:";
        $lines[] = '';
        $lines[] = '- **Colours**: extract the dominant brand palette from the screenshot — primary, secondary, and accent colours. Apply them with Tailwind arbitrary values, e.g. `bg-[#f97316]`, `border-[#f97316]`, `hover:bg-[#…]`, `ring-[#…]`. Use the primary colour for the submit button and primary accents.';
        $lines[] = '- **Typography & tone**: match the general typographic style (serif / sans / rounded / condensed) and the overall visual tone (minimal, bold, playful, corporate) shown in the screenshot.';
        $lines[] = '- **Backgrounds & surfaces**: mirror whether the site reads light or dark, and echo its card/surface treatment (borders, radius, shadows).';
        $lines[] = '- **Do not** embed or fabricate the logo image — no `<img>` for the logo, since no logo URL is provided. Convey the brand through colour, type, and layout instead.';
        $lines[] = '';
        $lines[] = 'Ensure the form feels on-brand: consistent colour use, readable contrast ratios, and a polished professional layout.';
        $lines[] = '';

        return implode("\n", $lines);
    }
}
