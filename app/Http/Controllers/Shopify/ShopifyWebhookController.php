<?php

namespace App\Http\Controllers\Shopify;

use App\Http\Controllers\Controller;
use App\Http\Middleware\Shopify\VerifyWebhook;
use App\Models\Integration;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class ShopifyWebhookController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [new Middleware(VerifyWebhook::class)];
    }

    public function __invoke(Request $request): JsonResponse
    {
        $topic = $request->header('X-Shopify-Topic');

        return match ($topic) {
            'app/uninstalled'        => $this->appUninstalled($request),
            'customers/data_request' => $this->customersDataRequest($request),
            'customers/redact'       => $this->customersRedact($request),
            'shop/redact'            => $this->shopRedact($request),
            default                  => response()->json([], 200),
        };
    }

    private function appUninstalled(Request $request): JsonResponse
    {
        $payload       = $request->json()->all();
        $shopDomain    = $payload['myshopify_domain'] ?? $payload['domain'] ?? null;
        $uninstalledAt = Carbon::now();

        Log::info('Webhook: app/uninstalled', ['shop' => $shopDomain]);

        if (! $shopDomain) {
            return response()->json([], 200);
        }

        $integration = Integration::where('name', $shopDomain)->first();

        if (! $integration) {
            Log::warning('Webhook: app/uninstalled — shop not found', ['shop' => $shopDomain]);
            return response()->json([], 200);
        }

        // Guard against delayed webhooks arriving after a reinstall
        if ($integration->updated_at && $integration->updated_at->gt($uninstalledAt)) {
            Log::info('Webhook: app/uninstalled — skipping, token refreshed after event', ['shop' => $shopDomain]);
            return response()->json([], 200);
        }

        $integration->update(['token' => null, 'status' => false]);

        Log::info('Webhook: app/uninstalled — token revoked, integration deactivated', ['shop' => $shopDomain]);

        return response()->json([], 200);
    }

    private function customersDataRequest(Request $request): JsonResponse
    {
        $payload = $request->json()->all();

        Log::info('Webhook: customers/data_request', [
            'shop'        => $payload['shop_domain'] ?? null,
            'customer_id' => $payload['customer']['id'] ?? null,
            'email'       => $payload['customer']['email'] ?? null,
        ]);

        // We store no Shopify customer IDs — only hashed IPs in metadata.
        return response()->json([], 200);
    }

    private function customersRedact(Request $request): JsonResponse
    {
        $payload = $request->json()->all();

        Log::info('Webhook: customers/redact', [
            'shop'        => $payload['shop_domain'] ?? null,
            'customer_id' => $payload['customer']['id'] ?? null,
        ]);

        // No customer-identifiable data stored — nothing to delete.
        return response()->json([], 200);
    }

    private function shopRedact(Request $request): JsonResponse
    {
        $payload    = $request->json()->all();
        $shopDomain = $payload['shop_domain'] ?? null;

        Log::info('Webhook: shop/redact', ['shop' => $shopDomain]);

        if ($shopDomain) {
            $user = User::where('name', $shopDomain)->first();

            if ($user) {
                $user->formResponses()->delete();
                $user->aiGenerations()->delete();
                $user->forms()->each(fn ($form) => $form->delete());
                $user->delete();

                Log::info('Webhook: shop/redact — all data deleted', ['shop' => $shopDomain]);
            }
        }

        return response()->json([], 200);
    }
}
