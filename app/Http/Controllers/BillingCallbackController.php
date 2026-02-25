<?php

namespace App\Http\Controllers;

use App\Services\BillingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BillingCallbackController extends Controller
{
    public function __invoke(Request $request, BillingService $billing): \Illuminate\Http\RedirectResponse
    {
        $chargeId = $request->query('charge_id');
        $plan     = $request->query('plan');

        if (!$chargeId || !in_array($plan, ['starter', 'growing'])) {
            return redirect('/')->with('billing_error', 'Invalid billing callback.');
        }

        $user = Auth::user();

        if (!$user) {
            return redirect('/');
        }

        try {
            $billing->activateSubscription($user, $chargeId, $plan);
        } catch (\Throwable $e) {
            return redirect('/pricing')->with('billing_error', 'Failed to activate subscription. Please contact support.');
        }

        return redirect('/pricing')->with('billing_success', ucfirst($plan));
    }
}
