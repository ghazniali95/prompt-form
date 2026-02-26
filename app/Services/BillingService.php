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
     * Create a recurring subscription via GraphQL and return the confirmation URL.
     */
    public function createSubscription(User $user, string $plan): string
    {
        if (! $user->shopify_token) {
            throw new \RuntimeException('Shopify billing error: shop has no access token (re-install required)');
        }

        $returnUrl = url('/billing/callback') . '?' . http_build_query([
            'plan' => $plan,
            'shop' => $user->name,
        ]);

        $mutation = <<<'GQL'
        mutation AppSubscriptionCreate(
            $name: String!,
            $returnUrl: URL!,
            $test: Boolean,
            $lineItems: [AppSubscriptionLineItemInput!]!
        ) {
            appSubscriptionCreate(
                name: $name
                returnUrl: $returnUrl
                test: $test
                lineItems: $lineItems
            ) {
                appSubscription {
                    id
                    status
                }
                confirmationUrl
                userErrors {
                    field
                    message
                }
            }
        }
        GQL;

        $variables = [
            'name'      => self::PLAN_NAMES[$plan],
            'returnUrl' => $returnUrl,
            'test'      => config('shopify-app.billing_test'),
            'lineItems' => [
                [
                    'plan' => [
                        'appRecurringPricingDetails' => [
                            'price'    => [
                                'amount'       => self::PLAN_PRICES[$plan],
                                'currencyCode' => 'USD',
                            ],
                            'interval' => 'EVERY_30_DAYS',
                        ],
                    ],
                ],
            ],
        ];

        $response = $user->api()->graph($mutation, $variables);

        if ($response['errors']) {
            \Log::error('Shopify billing GraphQL error', [
                'shop'   => $user->name,
                'plan'   => $plan,
                'status' => $response['status'] ?? null,
                'body'   => json_encode($response['body']),
            ]);
            throw new \RuntimeException(
                'Shopify billing error: [' . ($response['status'] ?? '?') . '] ' . json_encode($response['body'])
            );
        }

        $result          = $response['body']->data->appSubscriptionCreate ?? null;
        $subscription    = $result->appSubscription ?? null;
        $confirmationUrl = $result->confirmationUrl ?? null;

        if (! $subscription || ! $confirmationUrl) {
            $userErrors = is_array($result->userErrors ?? null) ? $result->userErrors : [];
            $errors     = collect($userErrors)->pluck('message')->filter()->implode(', ');
            \Log::error('Shopify billing userErrors', ['shop' => $user->name, 'errors' => $errors, 'result' => json_encode($result)]);
            throw new \RuntimeException('Shopify billing error: ' . ($errors ?: 'no confirmation URL returned'));
        }

        // Store GID (e.g. gid://shopify/AppSubscription/12345) and mark pending
        $user->update([
            'shopify_charge_id'   => $subscription->id,
            'subscription_status' => 'pending',
        ]);

        return $confirmationUrl;
    }

    /**
     * Verify a subscription is active after merchant approval and update the user's plan.
     * With GraphQL, Shopify activates the subscription automatically — we just verify status.
     */
    public function activateSubscription(User $user, string $chargeId, string $plan): void
    {
        // Shopify passes a numeric charge_id in the callback URL; build the GID.
        $gid = str_starts_with($chargeId, 'gid://')
            ? $chargeId
            : "gid://shopify/AppSubscription/{$chargeId}";

        $query = <<<'GQL'
        query GetAppSubscription($id: ID!) {
            node(id: $id) {
                ... on AppSubscription {
                    id
                    status
                }
            }
        }
        GQL;

        $response = $user->api()->graph($query, ['id' => $gid]);

        if ($response['errors']) {
            throw new \RuntimeException('Failed to verify subscription: ' . json_encode($response['body']));
        }

        $subscription = $response['body']->data->node ?? null;
        $status       = strtoupper($subscription->status ?? '');

        if (! in_array($status, ['ACTIVE', 'ACCEPTED'])) {
            throw new \RuntimeException("Subscription not active (status: {$status})");
        }

        $user->update([
            'plan'                => $plan,
            'shopify_charge_id'   => $gid,
            'subscription_status' => 'active',
        ]);
    }

    /**
     * Cancel the active subscription via GraphQL and downgrade user to free.
     */
    public function cancelSubscription(User $user): void
    {
        $chargeId = $user->shopify_charge_id;

        if ($chargeId) {
            $mutation = <<<'GQL'
            mutation AppSubscriptionCancel($id: ID!) {
                appSubscriptionCancel(id: $id) {
                    appSubscription {
                        id
                        status
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
            GQL;

            $user->api()->graph($mutation, ['id' => $chargeId]);
        }

        $user->update([
            'plan'                => 'free',
            'shopify_charge_id'   => null,
            'subscription_status' => null,
        ]);
    }
}
