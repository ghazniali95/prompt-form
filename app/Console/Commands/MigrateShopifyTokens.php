<?php

namespace App\Console\Commands;

use App\Models\Integration;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * One-off migration of legacy permanent offline tokens to expiring ones.
 *
 * Shopify revokes the original token on a successful exchange and the change
 * cannot be undone, so this runs shop by shop: a failure on one store leaves
 * every other store exactly as it was.
 */
class MigrateShopifyTokens extends Command
{
    protected $signature = 'shopify:migrate-tokens
                            {--dry-run : List what would be migrated without calling Shopify}
                            {--shop= : Migrate a single shop domain only}';

    protected $description = 'Exchange legacy permanent Shopify offline tokens for expiring ones';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        // A legacy token is one with no expiry recorded against it.
        $query = Integration::query()
            ->where('type', 'shopify')
            ->where('status', true)
            ->whereNotNull('token')
            ->whereNull('token_expires_at');

        if ($shop = $this->option('shop')) {
            $query->where('name', $shop);
        }

        $integrations = $query->get();

        if ($integrations->isEmpty()) {
            $this->info('No legacy tokens to migrate.');

            return self::SUCCESS;
        }

        $this->info("Found {$integrations->count()} legacy token(s) to migrate.");
        $this->newLine();

        if ($dryRun) {
            $this->table(
                ['ID', 'Shop', 'Token prefix', 'Connected'],
                $integrations->map(fn (Integration $i) => [
                    $i->id,
                    $i->name,
                    substr((string) $i->token, 0, 6).'…',
                    $i->created_at?->toDateString(),
                ])->all()
            );
            $this->warn('Dry run — nothing was sent to Shopify.');

            return self::SUCCESS;
        }

        $this->warn('Shopify revokes the original token on success. This cannot be undone.');
        if (! $this->confirm('Migrate these tokens now?', false)) {
            $this->info('Aborted.');

            return self::SUCCESS;
        }

        $migrated = 0;
        $failed   = 0;

        foreach ($integrations as $integration) {
            try {
                $this->migrate($integration);
                $this->line("  <info>✓</info> {$integration->name}");
                $migrated++;
            } catch (Throwable $e) {
                // Keep going: each shop is independent, and a store that fails
                // here still holds its original working token.
                $this->line("  <error>✗</error> {$integration->name} — {$e->getMessage()}");
                Log::error("shopify:migrate-tokens failed for integration {$integration->id}", [
                    'shop'  => $integration->name,
                    'error' => $e->getMessage(),
                ]);
                $failed++;
            }
        }

        $this->newLine();
        $this->info("Migrated: {$migrated}   Failed: {$failed}");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }

    /**
     * @throws \RuntimeException when Shopify rejects the exchange, so the
     *         integration is left holding its original working token.
     */
    private function migrate(Integration $integration): void
    {
        $response = Http::asForm()->post("https://{$integration->name}/admin/oauth/access_token", [
            'client_id'            => config('services.shopify.client_id'),
            'client_secret'        => config('services.shopify.client_secret'),
            'grant_type'           => 'urn:ietf:params:oauth:grant-type:token-exchange',
            'subject_token'        => $integration->token,
            'subject_token_type'   => 'urn:shopify:params:oauth:token-type:offline-access-token',
            'requested_token_type' => 'urn:shopify:params:oauth:token-type:offline-access-token',
            'expiring'             => '1',
        ]);

        if ($response->failed()) {
            throw new \RuntimeException("HTTP {$response->status()}: {$response->body()}");
        }

        $accessToken = $response->json('access_token');

        if (! $accessToken) {
            throw new \RuntimeException('No access_token in response');
        }

        $integration->token            = $accessToken;
        $integration->refresh_token    = $response->json('refresh_token');
        $integration->token_expires_at = $response->json('expires_in')
            ? now()->addSeconds($response->json('expires_in'))
            : null;
        $integration->saveQuietly();
    }
}
