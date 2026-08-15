<?php

namespace Tests\Feature;

use App\Models\Integration;
use App\Services\Shopify\AuthService;
use App\Services\Shopify\TokenExchangeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Both ways of obtaining an offline token must ask for the *expiring* variant.
 * Omitting `expiring=1` silently yields a permanent token, which the Admin API
 * stops accepting for public apps on 1 January 2027 — and which is invisible
 * locally, because a permanent token works fine right up until it doesn't.
 */
class ShopifyTokenAcquisitionTest extends TestCase
{
    use RefreshDatabase;

    private const SHOP = 'test-shop.myshopify.com';

    private function fakeTokenResponse(): void
    {
        Http::fake(['*/admin/oauth/access_token' => Http::response([
            'access_token'  => 'an-access-token',
            'refresh_token' => 'a-refresh-token',
            'expires_in'    => 3600,
            'scope'         => 'write_products',
        ])]);
    }

    public function test_token_exchange_requests_an_expiring_token_and_stores_the_whole_set(): void
    {
        $this->fakeTokenResponse();

        $user = app(TokenExchangeService::class)
            ->exchangeAndResolveUser(self::SHOP, 'a-session-token');

        $this->assertNotNull($user);

        Http::assertSent(function ($request) {
            return $request['expiring'] === '1'
                && $request['grant_type'] === 'urn:ietf:params:oauth:grant-type:token-exchange'
                && $request['requested_token_type'] === 'urn:shopify:params:oauth:token-type:offline-access-token';
        });

        $integration = Integration::where('name', self::SHOP)->firstOrFail();
        $this->assertSame('an-access-token', $integration->token);
        $this->assertSame('a-refresh-token', $integration->refresh_token);
        $this->assertTrue($integration->token_expires_at->isFuture());
    }

    public function test_the_oauth_code_grant_requests_an_expiring_token(): void
    {
        $this->fakeTokenResponse();

        $tokenData = app(AuthService::class)->exchangeCode(self::SHOP, 'an-oauth-code');

        Http::assertSent(fn ($request) => $request['expiring'] === '1' && $request['code'] === 'an-oauth-code');

        $this->assertSame('an-access-token', $tokenData['access_token']);
        $this->assertSame('a-refresh-token', $tokenData['refresh_token']);
        $this->assertSame(3600, $tokenData['expires_in']);
    }

    public function test_the_code_grant_persists_the_expiry_onto_the_integration(): void
    {
        $this->fakeTokenResponse();

        $auth        = app(AuthService::class);
        $integration = $auth->upsertIntegration(self::SHOP, $auth->exchangeCode(self::SHOP, 'an-oauth-code'));

        $this->assertSame('a-refresh-token', $integration->refresh_token);
        $this->assertTrue($integration->token_expires_at->isFuture());
    }

    public function test_a_failed_exchange_returns_null_rather_than_a_partial_integration(): void
    {
        Http::fake(['*/admin/oauth/access_token' => Http::response(['error' => 'invalid_request'], 400)]);

        $this->assertNull(app(AuthService::class)->exchangeCode(self::SHOP, 'a-bad-code'));
        $this->assertNull(app(TokenExchangeService::class)->exchangeAndResolveUser(self::SHOP, 'a-bad-token'));
        $this->assertDatabaseMissing('integrations', ['name' => self::SHOP]);
    }
}
