<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\UserSubscription;
use App\Services\Billing\StripeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class StripeCallbackController extends Controller
{
    public function __construct(private StripeService $stripe) {}

    /**
     * GET /billing/stripe/success?session_id=cs_...
     * Activates the subscription after successful Stripe Checkout.
     */
    public function success(Request $request): RedirectResponse
    {
        $sessionId = $request->query('session_id');

        if (! $sessionId) {
            return redirect('/pricing?billing_error=1');
        }

        try {
            $session      = $this->stripe->retrieveSession($sessionId);
            $stripeSubId  = $session->subscription?->id;
            $paymentMethod = $session->subscription?->default_payment_method;

            // Find the pending record created during subscribe()
            $subscription = UserSubscription::where('provider_subscription_id', $sessionId)
                ->where('provider', 'stripe')
                ->where('status', 'incomplete')
                ->first();

            if (! $subscription) {
                // Race condition: webhook already activated it
                return redirect('/pricing?billing_success=1');
            }

            $user = $subscription->user;

            // Update subscription to active
            $subscription->update([
                'provider_subscription_id' => $stripeSubId,
                'status'                   => 'active',
                'activated_on'             => now(),
            ]);

            // Store payment method details on user
            if ($paymentMethod) {
                $card = $paymentMethod->card ?? null;
                $user->update([
                    'pm_type'       => $card?->brand ?? $paymentMethod->type,
                    'pm_last_four'  => $card?->last4,
                ]);
            }

            // Record invoice
            $plan = Plan::where('slug', $subscription->plan_slug)->first();
            Invoice::create([
                'user_id'              => $user->id,
                'user_subscription_id' => $subscription->id,
                'provider'             => 'stripe',
                'provider_invoice_id'  => $session->invoice ?? null,
                'plan_name'            => $plan?->name,
                'amount'               => ($session->amount_total ?? 0) / 100,
                'currency'             => $session->currency ?? 'usd',
                'status'               => 'paid',
                'invoice_date'         => now(),
            ]);

            return redirect('/pricing?billing_success=1');
        } catch (\Throwable $e) {
            Log::error('Stripe callback failed: ' . $e->getMessage(), ['session_id' => $sessionId]);
            return redirect('/pricing?billing_error=1');
        }
    }

    /**
     * GET /billing/stripe/cancel
     * User cancelled on Stripe Checkout page.
     */
    public function cancel(): RedirectResponse
    {
        return redirect('/pricing?billing_cancelled=1');
    }
}
