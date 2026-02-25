<?php

namespace App\Http\Controllers\Api\Shopify;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AppUninstalledController extends Controller
{
    /**
     * app/uninstalled
     *
     * Fired when a merchant uninstalls the app. We revoke the stored OAuth
     * token and cancel the subscription. We do NOT delete form data here —
     * that happens 48 hours later via the shop/redact GDPR webhook.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $payload    = $request->json()->all();
        $shopDomain = $payload['domain'] ?? null;

        Log::info('Webhook: app/uninstalled', ['shop' => $shopDomain]);

        if ($shopDomain) {
            $user = User::where('name', $shopDomain)->first();

            if ($user) {
                $user->update([
                    'shopify_token'       => null,
                    'shopify_charge_id'   => null,
                    'subscription_status' => 'cancelled',
                    'plan'                => 'free',
                ]);

                Log::info('App uninstalled: token revoked', ['shop' => $shopDomain]);
            }
        }

        return response()->json([], 200);
    }
}
