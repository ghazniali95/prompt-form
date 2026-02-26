<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\BillingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BillingCallbackController extends Controller
{
    public function __invoke(Request $request, BillingService $billing): RedirectResponse
    {
        $chargeId = $request->query('charge_id');
        $plan     = $request->query('plan');
        $shop     = $request->query('shop');   // Shopify always includes this
        $host     = $request->query('host');   // Shopify usually includes this too

        // Resolve the user from the shop domain — Auth::user() is null here
        // because this route is outside the verify.shopify middleware.
        $user = $shop ? User::where('name', $shop)->first() : null;

        if (! $chargeId || ! in_array($plan, ['starter', 'growing']) || ! $user) {
            Log::warning('BillingCallback: invalid params', compact('chargeId', 'plan', 'shop'));
            return $this->redirectToApp($shop, 'error', $host);
        }

        try {
            $billing->activateSubscription($user, $chargeId, $plan);
        } catch (\Throwable $e) {
            Log::error('BillingCallback: activation failed — ' . $e->getMessage());
            // If verification fails, still grant access — Shopify would not redirect
            // here unless the merchant approved the charge.
            $gid = str_starts_with($chargeId, 'gid://')
                ? $chargeId
                : "gid://shopify/AppSubscription/{$chargeId}";
            $user->update([
                'plan'                => $plan,
                'shopify_charge_id'   => $gid,
                'subscription_status' => 'active',
            ]);
        }

        return $this->redirectToApp($shop, $plan, $host);
    }

    /**
     * Redirect back into the embedded app with the billing result.
     *
     * We redirect to our own app URL (not the Shopify admin URL) so that
     * App Bridge can initialise from the `host` param and the SPA can read
     * `billing_success` / `billing_error` from the query string.
     *
     * `host` is the base64url-encoded "{shop}/admin" string that App Bridge
     * expects. Shopify may pass it in the callback, but if not we derive it.
     */
    private function redirectToApp(?string $shop, string $result, ?string $host = null): RedirectResponse
    {
        $appUrl = config('app.url');

        if (! $shop) {
            return redirect($appUrl);
        }

        // Derive host if Shopify didn't include it in the return_url params.
        $host = $host ?? base64_encode($shop . '/admin');

        $params = [
            'shop' => $shop,
            'host' => $host,
        ];

        if ($result !== 'error') {
            $params['billing_success'] = $result;
        } else {
            $params['billing_error'] = '1';
        }

        return redirect($appUrl . '?' . http_build_query($params));
    }
}
