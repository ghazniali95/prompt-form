<?php

namespace App\Http\Controllers\Api\V1\Shopify;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class AppUninstalledController extends Controller
{
    public function __invoke(Request $request): JsonResponse
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
            Log::warning('App uninstalled: shop not found', ['shop' => $shopDomain]);
            return response()->json([], 200);
        }

        // Guard against delayed webhooks arriving after a reinstall
        if ($integration->updated_at && $integration->updated_at->gt($uninstalledAt)) {
            Log::info('App uninstalled: skipping — token refreshed after uninstall event', ['shop' => $shopDomain]);
            return response()->json([], 200);
        }

        $integration->update(['token' => null, 'status' => false]);

        Log::info('App uninstalled: token revoked, integration deactivated', ['shop' => $shopDomain]);

        return response()->json([], 200);
    }
}
