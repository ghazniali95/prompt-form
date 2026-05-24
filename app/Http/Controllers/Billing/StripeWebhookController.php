<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\User;
use App\Models\UserSubscription;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Stripe\Event;
use Stripe\Stripe;
use Stripe\Webhook;

class StripeWebhookController extends Controller
{
    public function handle(Request $request): Response
    {
        Stripe::setApiKey(config('services.stripe.secret'));

        $secret    = config('services.stripe.webhook_secret');
        $signature = $request->header('Stripe-Signature');

        try {
            $event = $secret
                ? Webhook::constructEvent($request->getContent(), $signature, $secret)
                : Event::constructFrom(json_decode($request->getContent(), true));
        } catch (\Throwable $e) {
            Log::warning('Stripe webhook signature failed: ' . $e->getMessage());
            return response('Invalid signature', 400);
        }

        match ($event->type) {
            'checkout.session.completed'        => $this->handleCheckoutCompleted($event),
            'customer.subscription.updated'     => $this->handleSubscriptionUpdated($event),
            'customer.subscription.deleted'     => $this->handleSubscriptionDeleted($event),
            'invoice.payment_succeeded'         => $this->handleInvoicePaid($event),
            'payment_method.attached'           => $this->handlePaymentMethodAttached($event),
            default                             => null,
        };

        return response('OK', 200);
    }

    // ─────────────────────────────────────────────────────────────────────────

    private function handleCheckoutCompleted(Event $event): void
    {
        $session   = $event->data->object;
        $sessionId = $session->id;
        $stripeSubId = $session->subscription;

        if (! $stripeSubId) {
            return; // one-time payment, not a subscription
        }

        $subscription = UserSubscription::where('provider_subscription_id', $sessionId)
            ->where('provider', 'stripe')
            ->where('status', 'incomplete')
            ->first();

        if ($subscription) {
            $subscription->update([
                'provider_subscription_id' => $stripeSubId,
                'status'                   => 'active',
                'activated_on'             => now(),
            ]);
            Log::info("Stripe webhook: activated subscription #{$subscription->id} for session {$sessionId}");
        }
    }

    private function handleSubscriptionUpdated(Event $event): void
    {
        $stripeSub   = $event->data->object;
        $stripeSubId = $stripeSub->id;

        $subscription = UserSubscription::where('provider_subscription_id', $stripeSubId)
            ->where('provider', 'stripe')
            ->first();

        if (! $subscription) {
            return;
        }

        $statusMap = [
            'active'   => 'active',
            'trialing' => 'trialing',
            'past_due' => 'past_due',
            'canceled' => 'cancelled',
            'unpaid'   => 'past_due',
            'paused'   => 'paused',
        ];

        $newStatus = $statusMap[$stripeSub->status] ?? $stripeSub->status;

        $update = ['status' => $newStatus];

        if ($stripeSub->cancel_at_period_end && ! $subscription->cancelled_at) {
            $update['cancelled_at'] = now();
        }

        $subscription->update($update);
    }

    private function handleSubscriptionDeleted(Event $event): void
    {
        $stripeSubId = $event->data->object->id;

        UserSubscription::where('provider_subscription_id', $stripeSubId)
            ->where('provider', 'stripe')
            ->update([
                'status'       => 'cancelled',
                'cancelled_at' => now(),
            ]);
    }

    private function handleInvoicePaid(Event $event): void
    {
        $stripeInvoice = $event->data->object;
        $customerId    = $stripeInvoice->customer;

        $user = User::where('stripe_id', $customerId)->first();
        if (! $user) {
            return;
        }

        $subscription = UserSubscription::where('provider_subscription_id', $stripeInvoice->subscription)
            ->where('provider', 'stripe')
            ->first();

        // Avoid duplicate invoice records
        if (Invoice::where('provider_invoice_id', $stripeInvoice->id)->exists()) {
            return;
        }

        Invoice::create([
            'user_id'              => $user->id,
            'user_subscription_id' => $subscription?->id,
            'provider'             => 'stripe',
            'provider_invoice_id'  => $stripeInvoice->id,
            'plan_name'            => $subscription?->plan?->name,
            'amount'               => $stripeInvoice->amount_paid / 100,
            'currency'             => $stripeInvoice->currency,
            'status'               => 'paid',
            'hosted_invoice_url'   => $stripeInvoice->hosted_invoice_url,
            'invoice_date'         => now()->createFromTimestamp($stripeInvoice->created),
        ]);
    }

    private function handlePaymentMethodAttached(Event $event): void
    {
        $pm         = $event->data->object;
        $customerId = $pm->customer;

        if (! $customerId) {
            return;
        }

        $user = User::where('stripe_id', $customerId)->first();
        if (! $user) {
            return;
        }

        $card = $pm->card ?? null;
        $user->update([
            'pm_type'      => $card?->brand ?? $pm->type,
            'pm_last_four' => $card?->last4,
        ]);
    }
}
