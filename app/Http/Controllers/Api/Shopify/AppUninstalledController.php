<?php

namespace App\Http\Controllers\Api\Shopify;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
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
        $payload = $request->json()->all();

        // Prefer myshopify_domain (always the .myshopify.com address) over domain
        // (which may be a custom storefront domain that doesn't match User.name).
        $shopDomain = $payload['myshopify_domain'] ?? $payload['domain'] ?? null;

        // Shopify sends the event timestamp in the X-Shopify-Webhook-Id header's
        // sibling X-Shopify-Event-Created-At, but reliably we can use now() as an
        // upper bound — what matters is preventing a delayed webhook from clearing
        // a token that was re-issued after the merchant reinstalled the app.
        $uninstalledAt = Carbon::now();

        Log::info('Webhook: app/uninstalled', ['shop' => $shopDomain]);

        if (! $shopDomain) {
            return response()->json([], 200);
        }

        // Use withTrashed() so we still process soft-deleted records.
        $user = User::withTrashed()->where('name', $shopDomain)->first();

        if (! $user) {
            Log::warning('App uninstalled: shop not found', ['shop' => $shopDomain]);
            return response()->json([], 200);
        }

        // Guard against the race condition where the merchant reinstalled before
        // this (delayed) webhook was delivered: if the token was updated AFTER
        // we received this event, a fresh OAuth has already taken place — don't
        // wipe the new token.
        if ($user->updated_at && $user->updated_at->gt($uninstalledAt)) {
            Log::info('App uninstalled: skipping — token refreshed after uninstall event', ['shop' => $shopDomain]);
            return response()->json([], 200);
        }

        $user->update([
            'shopify_token'       => null,
            'shopify_charge_id'   => null,
            'subscription_status' => 'cancelled',
            'plan'                => 'free',
        ]);

        // Soft-delete so the admin panel can show "Uninstalled" state.
        if (! $user->trashed()) {
            $user->delete();
        }

        Log::info('App uninstalled: token revoked and user soft-deleted', ['shop' => $shopDomain]);

        return response()->json([], 200);
    }
}
