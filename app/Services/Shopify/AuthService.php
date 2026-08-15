<?php

namespace App\Services\Shopify;

use App\Models\Integration;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class AuthService
{
    /**
     * Validate that a shop domain is a legitimate myshopify.com address.
     */
    public function isValidShop(string $shop): bool
    {
        return (bool) preg_match('/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/', $shop);
    }

    /**
     * Build the Shopify OAuth authorization URL and store a nonce in the session.
     */
    public function buildAuthUrl(string $shop): string
    {
        $state = Str::random(32);
        Cache::put("shopify_oauth_state_{$shop}", $state, now()->addMinutes(5));

        return "https://{$shop}/admin/oauth/authorize?" . http_build_query([
            'client_id'    => config('services.shopify.client_id'),
            'scope'        => config('services.shopify.scopes'),
            'redirect_uri' => config('services.shopify.redirect_uri'),
            'state'        => $state,
        ]);
    }

    /**
     * Validate the HMAC on an incoming Shopify request (install or callback).
     */
    public function validateHmac(Request $request): bool
    {
        $hmac   = $request->query('hmac', '');
        $params = $request->except(['hmac']);

        ksort($params);

        $message = collect($params)
            ->map(fn ($v, $k) => "{$k}={$v}")
            ->values()
            ->implode('&');

        $computed = hash_hmac('sha256', $message, config('services.shopify.client_secret'));

        return hash_equals($computed, $hmac);
    }

    /**
     * Exchange the OAuth code for an expiring offline access token.
     *
     * The `expiring` flag asks Shopify for a rotating offline token, so the
     * response carries a refresh_token + expires_in alongside the access_token.
     * Without it Shopify issues a permanent offline token, which the Admin API
     * stops accepting for public apps on 1 January 2027.
     *
     * @return array{access_token: string, refresh_token: ?string, expires_in: ?int}|null
     */
    public function exchangeCode(string $shop, string $code): ?array
    {
        $response = Http::asForm()->post("https://{$shop}/admin/oauth/access_token", [
            'client_id'     => config('services.shopify.client_id'),
            'client_secret' => config('services.shopify.client_secret'),
            'code'          => $code,
            'expiring'      => '1',
        ]);

        if (! $response->successful() || ! $response->json('access_token')) {
            return null;
        }

        return [
            'access_token'  => $response->json('access_token'),
            'refresh_token' => $response->json('refresh_token'),
            'expires_in'    => $response->json('expires_in'),
        ];
    }

    /**
     * Upsert the Integration record for a shop and store the token set.
     *
     * @param array{access_token: string, refresh_token: ?string, expires_in: ?int} $tokenData
     */
    public function upsertIntegration(string $shop, array $tokenData): Integration
    {
        $integration = Integration::firstOrNew(['name' => $shop]);
        $integration->token            = $tokenData['access_token'];
        $integration->refresh_token    = $tokenData['refresh_token'];
        $integration->token_expires_at = $tokenData['expires_in']
            ? now()->addSeconds($tokenData['expires_in'])
            : null;
        $integration->type   = 'shopify';
        $integration->status = true;

        // Ensure a User exists and is linked — required for ApiAuth to resolve
        if (! $integration->user_id) {
            $user = User::firstOrCreate(
                ['email' => "shopify+{$shop}@promptform.app"],
                ['name' => $shop, 'login_type' => 'shopify']
            );
            $integration->user_id = $user->id;
        }

        $integration->save();

        return $integration;
    }
}
