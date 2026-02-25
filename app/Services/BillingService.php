<?php

namespace App\Services;

use App\Models\User;

class BillingService
{
    const PLAN_NAMES = [
        'starter' => 'Starter Plan',
        'growing' => 'Growing Plan',
    ];

    const PLAN_PRICES = [
        'starter' => 9.00,
        'growing' => 24.00,
    ];

    /**
     * Create a recurring application charge on Shopify and return the confirmation URL.
     */
    public function createSubscription(User $user, string $plan): string
    {
        $returnUrl = url('/billing/callback') . '?plan=' . $plan;

        $response = $user->api()->rest(
            'POST',
            '/admin/api/2025-01/recurring_application_charges.json',
            [
                'recurring_application_charge' => [
                    'name'       => self::PLAN_NAMES[$plan],
                    'price'      => self::PLAN_PRICES[$plan],
                    'return_url' => $returnUrl,
                    'test'       => config('app.env') !== 'production',
                ],
            ]
        );

        if ($response->errors) {
            throw new \RuntimeException('Shopify billing error: ' . json_encode($response->body));
        }

        $charge = $response->body->recurring_application_charge;

        // Mark pending so we don't lose the charge_id if the user navigates away
        $user->update([
            'shopify_charge_id'   => $charge->id,
            'subscription_status' => 'pending',
        ]);

        return $charge->confirmation_url;
    }

    /**
     * Activate a charge after merchant approval and update the user's plan.
     */
    public function activateSubscription(User $user, string $chargeId, string $plan): void
    {
        $response = $user->api()->rest(
            'POST',
            "/admin/api/2025-01/recurring_application_charges/{$chargeId}/activate.json",
            []
        );

        if ($response->errors) {
            throw new \RuntimeException('Failed to activate charge: ' . json_encode($response->body));
        }

        $user->update([
            'plan'                => $plan,
            'shopify_charge_id'   => $chargeId,
            'subscription_status' => 'active',
        ]);
    }

    /**
     * Cancel the active subscription on Shopify and downgrade user to free.
     */
    public function cancelSubscription(User $user): void
    {
        $chargeId = $user->shopify_charge_id;

        if ($chargeId) {
            $user->api()->rest(
                'DELETE',
                "/admin/api/2025-01/recurring_application_charges/{$chargeId}.json"
            );
        }

        $user->update([
            'plan'                => 'free',
            'shopify_charge_id'   => null,
            'subscription_status' => null,
        ]);
    }
}
