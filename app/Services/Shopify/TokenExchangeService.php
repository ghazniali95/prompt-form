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
        $accessToken = $this->callTokenExchange($shop, $sessionToken);

        if (! $accessToken) {
            return null;
        }

        $integration = Integration::firstOrNew(['name' => $shop]);
        $integration->token  = $accessToken;
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

    private function callTokenExchange(string $shop, string $sessionToken): ?string
    {
        $response = Http::post("https://{$shop}/admin/oauth/access_token", [
            'client_id'            => config('services.shopify.client_id'),
            'client_secret'        => config('services.shopify.client_secret'),
            'grant_type'           => 'urn:ietf:params:oauth:grant-type:token-exchange',
            'subject_token'        => $sessionToken,
            'subject_token_type'   => 'urn:ietf:params:oauth:token-type:id_token',
            'requested_token_type' => 'urn:shopify:params:oauth:token-type:offline-access-token',
        ]);

        return $response->successful() ? $response->json('access_token') : null;
    }
}
