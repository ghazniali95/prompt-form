<?php

namespace App\Services\Shopify;

class JwtService
{
    /**
     * Decode and validate a Shopify session token (HS256 JWT).
     * Returns the claims array on success, null on failure.
     */
    public function decode(string $jwt): ?array
    {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            return null;
        }

        [$header, $payload, $signature] = $parts;

        $expected = rtrim(strtr(base64_encode(hash_hmac(
            'sha256',
            "{$header}.{$payload}",
            config('services.shopify.client_secret'),
            true
        )), '+/', '-_'), '=');

        if (! hash_equals($expected, $signature)) {
            return null;
        }

        $claims = json_decode(base64_decode(strtr($payload, '-_', '+/')), true);

        if (! $claims) {
            return null;
        }

        $now = time();

        // exp — token must not be expired (10s leeway for clock skew)
        if (! isset($claims['exp']) || $claims['exp'] < ($now - 10)) {
            return null;
        }

        // nbf — token must already be active
        if (isset($claims['nbf']) && $claims['nbf'] > ($now + 10)) {
            return null;
        }

        // aud — must match this app's client ID
        if (($claims['aud'] ?? null) !== config('services.shopify.client_id')) {
            return null;
        }

        // iss — must be a Shopify admin domain (https://*.myshopify.com/admin)
        $iss = $claims['iss'] ?? '';
        if (! preg_match('#^https://[a-zA-Z0-9\-]+\.myshopify\.com/admin$#', $iss)) {
            return null;
        }

        // dest — must be a valid myshopify.com domain
        $dest = $claims['dest'] ?? '';
        if (! preg_match('#^https://[a-zA-Z0-9\-]+\.myshopify\.com$#', $dest)) {
            return null;
        }

        return $claims;
    }

    /**
     * Extract the shop domain from a validated claims array.
     * The 'dest' claim is a full URL: https://store.myshopify.com
     */
    public function shopDomain(array $claims): ?string
    {
        $dest = $claims['dest'] ?? null;
        return $dest ? (parse_url($dest, PHP_URL_HOST) ?: null) : null;
    }
}
