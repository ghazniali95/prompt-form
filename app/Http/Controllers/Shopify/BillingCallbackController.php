<?php

namespace App\Http\Controllers\Shopify;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Services\Shopify\BillingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BillingCallbackController extends Controller
{
    public function __invoke(Request $request, BillingService $billing): RedirectResponse
    {
        $chargeId = $request->query('charge_id');
        $plan     = $request->query('plan');
        $shop     = $request->query('shop');
        $host     = $request->query('host');

        $integration = $shop ? Integration::where('name', $shop)->first() : null;

        if (! $chargeId || ! in_array($plan, ['starter', 'growing']) || ! $integration) {
            Log::warning('BillingCallback: invalid params', compact('chargeId', 'plan', 'shop'));
            return $this->redirectToApp($shop, 'error', $host);
        }

        try {
            $billing->activateSubscription($integration, $chargeId, $plan);
        } catch (\Throwable $e) {
            Log::error('BillingCallback: activation failed — ' . $e->getMessage(), [
                'shop'      => $shop,
                'plan'      => $plan,
                'charge_id' => $chargeId,
            ]);
            return $this->redirectToApp($shop, 'error', $host);
        }

        return $this->redirectToApp($shop, $plan, $host);
    }

    private function redirectToApp(?string $shop, string $result, ?string $host = null): RedirectResponse
    {
        $appUrl = config('app.url') . '/shopify/app';

        if (! $shop) {
            return redirect($appUrl);
        }

        $host   = $host ?? base64_encode($shop . '/admin');
        $params = ['shop' => $shop, 'host' => $host];

        if ($result !== 'error') {
            $params['billing_success'] = $result;
        } else {
            $params['billing_error'] = '1';
        }

        return redirect($appUrl . '?' . http_build_query($params));
    }
}
