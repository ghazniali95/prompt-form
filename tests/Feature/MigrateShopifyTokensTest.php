<?php

namespace Tests\Feature;

use App\Models\Integration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The migration revokes the original token on success and cannot be undone, so
 * the safety properties matter more than the happy path: a dry run must not
 * touch Shopify, and one store's failure must not disturb another's.
 */
class MigrateShopifyTokensTest extends TestCase
{
    use RefreshDatabase;

    private function legacyIntegration(string $shop): Integration
    {
        $user = User::create([
            'name'     => $shop,
            'email'    => 'shop-'.uniqid().'@example.com',
            'password' => 'secret123',
        ]);

        return Integration::create([
            'user_id'          => $user->id,
            'type'             => 'shopify',
            'name'             => $shop,
            'token'            => 'shpat_legacy_permanent_token',
            'refresh_token'    => null,
            'token_expires_at' => null,
            'status'           => true,
        ]);
    }

    public function test_a_dry_run_sends_nothing_to_shopify(): void
    {
        Http::fake();
        $integration = $this->legacyIntegration('a-shop.myshopify.com');

        $this->artisan('shopify:migrate-tokens', ['--dry-run' => true])
            ->assertSuccessful();

        Http::assertNothingSent();
        $this->assertSame('shpat_legacy_permanent_token', $integration->fresh()->token);
    }

    public function test_it_exchanges_a_legacy_token_and_stores_the_expiring_set(): void
    {
        Http::fake(['*/admin/oauth/access_token' => Http::response([
            'access_token'  => 'a-new-expiring-token',
            'refresh_token' => 'a-refresh-token',
            'expires_in'    => 3600,
        ])]);

        $integration = $this->legacyIntegration('a-shop.myshopify.com');

        $this->artisan('shopify:migrate-tokens')
            ->expectsConfirmation('Migrate these tokens now?', 'yes')
            ->assertSuccessful();

        Http::assertSent(fn ($request) => $request['expiring'] === '1'
            && $request['subject_token'] === 'shpat_legacy_permanent_token'
            && $request['subject_token_type'] === 'urn:shopify:params:oauth:token-type:offline-access-token');

        $integration->refresh();
        $this->assertSame('a-new-expiring-token', $integration->token);
        $this->assertSame('a-refresh-token', $integration->refresh_token);
        $this->assertTrue($integration->token_expires_at->isFuture());
    }

    public function test_declining_the_confirmation_changes_nothing(): void
    {
        Http::fake();
        $integration = $this->legacyIntegration('a-shop.myshopify.com');

        $this->artisan('shopify:migrate-tokens')
            ->expectsConfirmation('Migrate these tokens now?', 'no')
            ->assertSuccessful();

        Http::assertNothingSent();
        $this->assertSame('shpat_legacy_permanent_token', $integration->fresh()->token);
    }

    public function test_one_shops_failure_leaves_the_others_migrated_and_itself_untouched(): void
    {
        Http::fake([
            'https://good-shop.myshopify.com/*' => Http::response([
                'access_token'  => 'a-new-expiring-token',
                'refresh_token' => 'a-refresh-token',
                'expires_in'    => 3600,
            ]),
            'https://bad-shop.myshopify.com/*' => Http::response(['error' => 'invalid_subject_token'], 400),
        ]);

        $good = $this->legacyIntegration('good-shop.myshopify.com');
        $bad  = $this->legacyIntegration('bad-shop.myshopify.com');

        $this->artisan('shopify:migrate-tokens')
            ->expectsConfirmation('Migrate these tokens now?', 'yes')
            ->assertFailed();

        $this->assertSame('a-new-expiring-token', $good->fresh()->token);
        $this->assertSame('shpat_legacy_permanent_token', $bad->fresh()->token, 'a failed shop keeps its working token');
        $this->assertNull($bad->fresh()->token_expires_at);
    }

    public function test_already_migrated_tokens_are_skipped(): void
    {
        Http::fake();

        $this->legacyIntegration('a-shop.myshopify.com')->update([
            'refresh_token'    => 'a-refresh-token',
            'token_expires_at' => now()->addHour(),
        ]);

        $this->artisan('shopify:migrate-tokens')
            ->expectsOutput('No legacy tokens to migrate.')
            ->assertSuccessful();

        Http::assertNothingSent();
    }
}
