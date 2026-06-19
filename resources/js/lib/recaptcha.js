/**
 * Execute reCAPTCHA v3 and return a single-use token for the given action.
 * Returns null when reCAPTCHA isn't configured/loaded so callers can submit
 * without it (server verification fails open when no secret is set).
 */
export async function getRecaptchaToken(action, siteKey) {
    if (!siteKey || !window.grecaptcha) return null;
    await new Promise((resolve) => window.grecaptcha.ready(resolve));
    return window.grecaptcha.execute(siteKey, { action });
}
