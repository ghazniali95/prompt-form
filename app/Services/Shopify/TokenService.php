<?php

namespace App\Services\Shopify;

use App\Exceptions\ShopifyTokenRefreshException;
use App\Models\Integration;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TokenService
{
    // Refresh the token if it expires within this many seconds.
    private const REFRESH_BUFFER_SECONDS = 300;

    /**
     * Ensure the integration has a valid, non-expired Shopify access token.
     * Call this before any Shopify API request. Returns the integration with a
     * fresh token already persisted to the database.
     *
     * Integrations with no `token_expires_at` are legacy permanent offline
     * tokens — they are returned untouched and remain valid until migrated to
     * expiring tokens.
     */
    public static function ensureFreshToken(Integration $integration): Integration
    {
        if (! $integration->token_expires_at) {
            return $integration;
        }

        if ($integration->token_expires_at->subSeconds(self::REFRESH_BUFFER_SECONDS)->isFuture()) {
            return $integration;
        }

        return self::refresh($integration);
    }

    /**
     * Force-refresh the access token using the stored refresh token.
     * Saves the new token, refresh token and expiry back to the integration.
     *
     * @throws ShopifyTokenRefreshException when the refresh fails and the token
     *         already held has expired, so the caller cannot proceed.
     */
    public static function refresh(Integration $integration): Integration
    {
        if (! $integration->refresh_token) {
            return self::giveUp($integration, 'no refresh token stored');
        }

        try {
            // The shop domain lives in `name` on this model.
            $response = Http::asForm()->post("https://{$integration->name}/admin/oauth/access_token", [
                'client_id'     => config('services.shopify.client_id'),
                'client_secret' => config('services.shopify.client_secret'),
                'grant_type'    => 'refresh_token',
                'refresh_token' => $integration->refresh_token,
            ]);
        } catch (Exception $e) {
            return self::giveUp($integration, $e->getMessage());
        }

        if ($response->failed()) {
            return self::giveUp($integration, "HTTP {$response->status()}: {$response->body()}");
        }

        $data = $response->json();

        $integration->token            = $data['access_token'];
        $integration->refresh_token    = $data['refresh_token'] ?? $integration->refresh_token;
        $integration->token_expires_at = isset($data['expires_in'])
            ? now()->addSeconds($data['expires_in'])
            : null;
        $integration->saveQuietly();

        return $integration;
    }

    /**
     * Decide what a failed refresh means for the caller.
     *
     * Refreshes start REFRESH_BUFFER_SECONDS before expiry, so a failure often
     * leaves a token that is still perfectly valid — in that case the caller is
     * handed it and carries on, and the next call will try the refresh again.
     *
     * Once the token has actually expired there is nothing usable to return.
     * Handing the stale token back would send the caller into a request that
     * cannot succeed, logging a second, more confusing error for the same root
     * cause. Throwing instead surfaces it once, and lets a queued job retry.
     *
     * @throws ShopifyTokenRefreshException
     */
    private static function giveUp(Integration $integration, string $reason): Integration
    {
        if ($integration->token && $integration->token_expires_at?->isFuture()) {
            Log::warning("Shopify TokenService: refresh failed for integration {$integration->id}, continuing with the current token", [
                'reason'     => $reason,
                'expires_at' => $integration->token_expires_at->toDateTimeString(),
            ]);

            return $integration;
        }

        Log::error("Shopify TokenService: refresh failed for integration {$integration->id} and the stored token has expired", [
            'reason' => $reason,
        ]);

        throw new ShopifyTokenRefreshException(
            "Shopify token refresh failed for integration {$integration->id}: {$reason}"
        );
    }
}
