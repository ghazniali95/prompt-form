<?php

namespace Tests\Feature;

use App\Exceptions\ShopifyTokenRefreshException;
use App\Models\Integration;
use App\Models\User;
use App\Services\Shopify\TokenService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Shopify offline tokens expire and must be refreshed. These cover which
 * refresh failures are survivable and which have to stop the caller, plus the
 * legacy permanent tokens that predate expiry and must not be touched.
 */
class ShopifyTokenRefreshTest extends TestCase
{
    use RefreshDatabase;

    private function integration(array $attributes = []): Integration
    {
        $user = User::create([
            'name'     => 'Test shop',
            'email'    => 'shop-'.uniqid().'@example.com',
            'password' => 'secret123',
        ]);

        return Integration::create(array_merge([
            'user_id'          => $user->id,
            'type'             => 'shopify',
            'name'             => 'test-shop.myshopify.com',
            'token'            => 'current-token',
            'refresh_token'    => 'a-refresh-token',
            'token_expires_at' => now()->addMinutes(2), // inside the 300s refresh buffer
            'status'           => true,
        ], $attributes));
    }

    public function test_a_successful_refresh_stores_the_new_token_and_expiry(): void
    {
        Http::fake(['*/admin/oauth/access_token' => Http::response([
            'access_token'  => 'brand-new-token',
            'refresh_token' => 'brand-new-refresh-token',
            'expires_in'    => 3600,
        ])]);

        $integration = TokenService::ensureFreshToken($this->integration());

        $this->assertSame('brand-new-token', $integration->token);
        $this->assertSame('brand-new-refresh-token', $integration->refresh_token);
        $this->assertTrue($integration->token_expires_at->isFuture());
        $this->assertSame('brand-new-token', $integration->fresh()->token, 'the new token must be persisted');
    }

    public function test_a_token_well_inside_its_validity_window_is_not_refreshed(): void
    {
        Http::fake();

        $integration = TokenService::ensureFreshToken($this->integration([
            'token_expires_at' => now()->addHour(),
        ]));

        $this->assertSame('current-token', $integration->token);
        Http::assertNothingSent();
    }

    public function test_a_legacy_permanent_token_is_left_untouched(): void
    {
        Http::fake();

        // No expiry means a pre-migration permanent offline token.
        $integration = TokenService::ensureFreshToken($this->integration([
            'refresh_token'    => null,
            'token_expires_at' => null,
        ]));

        $this->assertSame('current-token', $integration->token);
        Http::assertNothingSent();
    }

    public function test_a_refresh_failure_is_survived_while_the_current_token_is_still_valid(): void
    {
        // The refresh runs 300s before expiry, so a blip here is harmless: the
        // token in hand still works and the next call will try again.
        Http::fake(fn () => throw new ConnectionException('cURL error 6: getaddrinfo() thread failed to start'));

        $integration = TokenService::ensureFreshToken($this->integration());

        $this->assertSame('current-token', $integration->token, 'the still-valid token should be handed back');
    }

    public function test_a_refresh_failure_throws_once_the_stored_token_has_expired(): void
    {
        Http::fake(fn () => throw new ConnectionException('cURL error 6: getaddrinfo() thread failed to start'));

        $this->expectException(ShopifyTokenRefreshException::class);

        TokenService::ensureFreshToken($this->integration([
            'token_expires_at' => now()->subMinute(),
        ]));
    }

    public function test_a_rejected_refresh_throws_rather_than_returning_an_expired_token(): void
    {
        Http::fake(['*/admin/oauth/access_token' => Http::response(['error' => 'invalid_grant'], 400)]);

        $this->expectException(ShopifyTokenRefreshException::class);

        TokenService::ensureFreshToken($this->integration([
            'token_expires_at' => now()->subMinute(),
        ]));
    }

    public function test_an_expired_token_with_no_refresh_token_throws(): void
    {
        Http::fake();

        $this->expectException(ShopifyTokenRefreshException::class);

        TokenService::ensureFreshToken($this->integration([
            'refresh_token'    => null,
            'token_expires_at' => now()->subMinute(),
        ]));
    }
}
