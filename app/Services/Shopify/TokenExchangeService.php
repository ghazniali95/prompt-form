<?php

namespace App\Services\Shopify;

use App\Models\Integration;
use App\Models\User;
use Illuminate\Support\Facades\Http;

class TokenExchangeService
{
    /**
     * Exchange a Shopify session token (JWT) for an offline access token.
     * Stores the result in the Integration record and returns the linked User.
     * Returns null if the exchange fails (app not installed / scopes revoked).
     */
    public function exchangeAndResolveUser(string $shop, string $sessionToken): ?User
    {
        $tokenData = $this->callTokenExchange($shop, $sessionToken);

        if (! $tokenData) {
            return null;
        }

        $integration = Integration::firstOrNew(['name' => $shop]);
        $integration->token            = $tokenData['access_token'];
        $integration->refresh_token    = $tokenData['refresh_token'];
        $integration->token_expires_at = $tokenData['expires_in']
            ? now()->addSeconds($tokenData['expires_in'])
            : null;
        $integration->type   = 'shopify';
        $integration->status = true;

        if (! $integration->user_id) {
            $user = User::firstOrCreate(
                ['email' => "shopify+{$shop}@promptform.app"],
                ['name' => $shop, 'login_type' => 'shopify']
            );
            $integration->user_id = $user->id;
        }

        $integration->save();

        return $integration->user;
    }

    /**
     * The `expiring` flag asks Shopify for a rotating offline token, so the
     * response carries a refresh_token + expires_in alongside the access_token.
     * Without it Shopify issues a permanent offline token, which the Admin API
     * stops accepting for public apps on 1 January 2027.
     *
     * @return array{access_token: string, refresh_token: ?string, expires_in: ?int}|null
     */
    private function callTokenExchange(string $shop, string $sessionToken): ?array
    {
        $response = Http::asForm()->post("https://{$shop}/admin/oauth/access_token", [
            'client_id'            => config('services.shopify.client_id'),
            'client_secret'        => config('services.shopify.client_secret'),
            'grant_type'           => 'urn:ietf:params:oauth:grant-type:token-exchange',
            'subject_token'        => $sessionToken,
            'subject_token_type'   => 'urn:ietf:params:oauth:token-type:id_token',
            'requested_token_type' => 'urn:shopify:params:oauth:token-type:offline-access-token',
            'expiring'             => '1',
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
}
