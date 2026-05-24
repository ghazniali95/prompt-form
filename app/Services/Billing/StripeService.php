<?php

namespace App\Services\Billing;

use App\Models\Plan;
use App\Models\User;
use App\Models\UserSubscription;
use Stripe\Stripe;
use Stripe\Customer;
use Stripe\Checkout\Session;
use Stripe\Subscription;

class StripeService
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    // ── Customer ──────────────────────────────────────────────────────────────

    public function ensureCustomer(User $user): string
    {
        if ($user->hasStripeId()) {
            return $user->stripe_id;
        }

        $customer = Customer::create([
            'email' => $user->email,
            'name'  => $user->name,
            'metadata' => ['user_id' => $user->id],
        ]);

        $user->update(['stripe_id' => $customer->id]);

        return $customer->id;
    }

    // ── Checkout ──────────────────────────────────────────────────────────────

    /**
     * Create a Stripe Checkout Session for a subscription.
     * Returns the session so the caller can store its ID and redirect the user.
     */
    public function createCheckoutSession(User $user, Plan $plan): Session
    {
        $customerId = $this->ensureCustomer($user);

        return Session::create([
            'customer'             => $customerId,
            'mode'                 => 'subscription',
            'payment_method_types' => ['card'],
            'line_items'           => [[
                'price'    => $plan->stripe_price_id,
                'quantity' => 1,
            ]],
            'success_url' => url('/billing/stripe/success') . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url'  => url('/billing/stripe/cancel'),
            'metadata'    => [
                'user_id'   => $user->id,
                'plan_slug' => $plan->slug,
            ],
            'subscription_data' => [
                'metadata' => [
                    'user_id'   => $user->id,
                    'plan_slug' => $plan->slug,
                ],
            ],
        ]);
    }

    /**
     * Retrieve a completed Checkout Session with its subscription expanded.
     */
    public function retrieveSession(string $sessionId): Session
    {
        return Session::retrieve([
            'id'     => $sessionId,
            'expand' => ['subscription', 'subscription.default_payment_method'],
        ]);
    }

    // ── Subscription management ───────────────────────────────────────────────

    /**
     * Cancel a Stripe subscription at period end.
     */
    public function cancelSubscription(string $stripeSubscriptionId): void
    {
        Subscription::update($stripeSubscriptionId, [
            'cancel_at_period_end' => true,
        ]);
    }

    /**
     * Cancel immediately (used when user requests immediate cancellation).
     */
    public function cancelSubscriptionNow(string $stripeSubscriptionId): void
    {
        $sub = Subscription::retrieve($stripeSubscriptionId);
        $sub->cancel();
    }

    /**
     * Retrieve a Stripe Subscription.
     */
    public function retrieveSubscription(string $stripeSubscriptionId): Subscription
    {
        return Subscription::retrieve([
            'id'     => $stripeSubscriptionId,
            'expand' => ['default_payment_method'],
        ]);
    }
}
