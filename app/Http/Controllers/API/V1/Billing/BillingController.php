<?php

namespace App\Http\Controllers\API\V1\Billing;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\UserSubscription;
use App\Services\Billing\StripeService;
use App\Services\PlanLimits;
use App\Services\Shopify\BillingService as ShopifyBillingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class BillingController extends Controller
{
    public function __construct(
        private StripeService $stripe,
        private ShopifyBillingService $shopify,
    ) {}

    // ── Current plan & usage ──────────────────────────────────────────────────

    public function current(): JsonResponse
    {
        $user         = Auth::user();
        $subscription = $user->activeSubscription;
        $plan         = $subscription?->plan_slug ?? 'free';
        $limits       = PlanLimits::forUser($user);
        $planModel    = Plan::where('slug', $plan)->first();

        return response()->json([
            'data' => [
                'plan'                  => $plan,
                'plan_name'             => $planModel?->name ?? ucfirst($plan),
                'provider'              => $subscription?->provider,
                'status'                => $subscription?->status ?? 'none',
                'activated_on'          => $subscription?->activated_on?->toISOString(),
                'cancelled_at'          => $subscription?->cancelled_at?->toISOString(),
                'pm_type'               => $user->pm_type,
                'pm_last_four'          => $user->pm_last_four,
                'limits' => [
                    'forms'       => $limits['forms'] === PHP_INT_MAX ? null : $limits['forms'],
                    'submissions' => $limits['submissions'] === PHP_INT_MAX ? null : $limits['submissions'],
                    'ai_tokens'   => $limits['ai_tokens'],
                ],
                'usage' => [
                    'forms'       => $user->forms()->count(),
                    'submissions' => PlanLimits::totalSubmissions($user),
                    'ai_tokens'   => PlanLimits::aiTokensUsedThisMonth($user),
                ],
            ],
        ]);
    }

    // ── Subscribe ─────────────────────────────────────────────────────────────

    /**
     * Create a checkout session or Shopify confirmation URL.
     * Web users (login_type=manual) → Stripe Checkout.
     * Shopify users (login_type=shopify) → Shopify GraphQL subscription.
     *
     * Returns: { data: { provider, checkout_url } }
     */
    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan_slug' => 'required|string|exists:plans,slug',
        ]);

        $user = Auth::user();
        $plan = Plan::where('slug', $validated['plan_slug'])->firstOrFail();

        if ($plan->is_free) {
            return response()->json(['error' => 'Cannot subscribe to free plan.'], 422);
        }

        // Cancel any existing incomplete session for same user to avoid orphans
        $user->subscriptions()
            ->where('status', 'incomplete')
            ->update(['status' => 'cancelled']);

        if ($user->login_type === 'shopify') {
            return $this->shopifySubscribe($user, $plan, $request);
        }

        return $this->stripeSubscribe($user, $plan);
    }

    private function stripeSubscribe($user, Plan $plan): JsonResponse
    {
        if (! $plan->stripe_price_id) {
            return response()->json(['error' => 'Stripe price not configured for this plan.'], 422);
        }

        try {
            $session = $this->stripe->createCheckoutSession($user, $plan);

            // Create a pending record so we can activate it on callback
            UserSubscription::create([
                'user_id'                  => $user->id,
                'plan_slug'                => $plan->slug,
                'provider'                 => 'stripe',
                'provider_subscription_id' => $session->id, // replaced with sub ID on success
                'status'                   => 'incomplete',
            ]);

            return response()->json([
                'data' => [
                    'provider'     => 'stripe',
                    'checkout_url' => $session->url,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Stripe subscribe failed: ' . $e->getMessage(), ['user_id' => $user->id]);
            return response()->json(['error' => 'Failed to create checkout session. Please try again.'], 500);
        }
    }

    private function shopifySubscribe($user, Plan $plan, Request $request): JsonResponse
    {
        $integration = $user->integrations()->where('type', 'shopify')->first();
        if (! $integration) {
            return response()->json(['error' => 'No Shopify integration found.'], 422);
        }

        try {
            $confirmationUrl = $this->shopify->createSubscription($integration, $plan->slug);

            UserSubscription::create([
                'user_id'    => $user->id,
                'plan_slug'  => $plan->slug,
                'provider'   => 'shopify',
                'status'     => 'incomplete',
                'confirmation_url' => $confirmationUrl,
            ]);

            return response()->json([
                'data' => [
                    'provider'         => 'shopify',
                    'checkout_url'     => $confirmationUrl,
                    'confirmation_url' => $confirmationUrl,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Shopify subscribe failed: ' . $e->getMessage(), ['user_id' => $user->id]);
            if (str_contains($e->getMessage(), 'session has expired')) {
                return response()->json(['error' => $e->getMessage()], 401);
            }
            return response()->json(['error' => 'Failed to create subscription. Please try again.'], 500);
        }
    }

    // ── Cancel ────────────────────────────────────────────────────────────────

    public function cancel(): JsonResponse
    {
        $user         = Auth::user();
        $subscription = $user->activeSubscription;

        if (! $subscription) {
            return response()->json(['error' => 'No active subscription found.'], 404);
        }

        try {
            if ($subscription->isStripe()) {
                $this->stripe->cancelSubscription($subscription->provider_subscription_id);
            } elseif ($subscription->isShopify()) {
                $integration = $user->integrations()->where('type', 'shopify')->first();
                if ($integration) {
                    $this->shopify->cancelSubscription($integration);
                }
            }

            $subscription->update([
                'status'       => 'cancelled',
                'cancelled_at' => now(),
            ]);

            return response()->json(['data' => ['plan' => 'free', 'status' => 'cancelled']]);
        } catch (\Throwable $e) {
            Log::error('Cancel subscription failed: ' . $e->getMessage(), ['user_id' => $user->id]);
            return response()->json(['error' => 'Failed to cancel subscription. Please try again.'], 500);
        }
    }

    // ── Plans list ────────────────────────────────────────────────────────────

    public function plans(): JsonResponse
    {
        $plans = Plan::orderBy('price')->get()->map(fn ($p) => [
            'id'             => $p->id,
            'slug'           => $p->slug,
            'name'           => $p->name,
            'price'          => (float) $p->price,
            'form_limit'     => $p->isUnlimitedForms() ? null : $p->form_limit,
            'response_limit' => $p->isUnlimitedResponses() ? null : $p->response_limit,
            'is_free'        => $p->is_free,
        ]);

        return response()->json(['data' => $plans]);
    }

    // ── Invoices ──────────────────────────────────────────────────────────────

    public function invoices(): JsonResponse
    {
        $invoices = Auth::user()->invoices()
            ->limit(24)
            ->get()
            ->map(fn ($inv) => [
                'id'                  => $inv->id,
                'provider'            => $inv->provider,
                'plan_name'           => $inv->plan_name,
                'amount'              => (float) $inv->amount,
                'currency'            => strtoupper($inv->currency),
                'status'              => $inv->status,
                'hosted_invoice_url'  => $inv->hosted_invoice_url,
                'invoice_date'        => $inv->invoice_date?->toISOString(),
            ]);

        return response()->json(['data' => $invoices]);
    }
}
