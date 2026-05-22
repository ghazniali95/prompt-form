<?php

namespace App\Services\Shopify;

use App\Models\Integration;

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

    public function __construct(private ApiService $api) {}

    /**
     * Create a recurring subscription via GraphQL and return the confirmation URL.
     */
    public function createSubscription(Integration $integration, string $plan): string
    {
        if (! $integration->token) {
            throw new \RuntimeException('Shopify billing error: shop has no access token (re-install required)');
        }

        $returnUrl = url('/auth/shopify/billing/callback') . '?' . http_build_query([
            'plan' => $plan,
            'shop' => $integration->name,
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
            'test'      => config('services.shopify.billing_test'),
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

        $response = $this->api->graph($integration, $mutation, $variables);

        if ($response['errors']) {
            \Log::error('Shopify billing GraphQL error', [
                'shop'   => $integration->name,
                'plan'   => $plan,
                'status' => $response['status'] ?? null,
                'body'   => json_encode($response['body']),
            ]);

            if (($response['status'] ?? null) === 401) {
                $integration->update(['token' => null]);
                throw new \RuntimeException('Your session has expired. Please reload the app to re-authenticate with Shopify.');
            }

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
            \Log::error('Shopify billing userErrors', ['shop' => $integration->name, 'errors' => $errors]);
            throw new \RuntimeException('Shopify billing error: ' . ($errors ?: 'no confirmation URL returned'));
        }

        return $confirmationUrl;
    }

    /**
     * Verify a subscription is active after merchant approval.
     */
    public function activateSubscription(Integration $integration, string $chargeId, string $plan): void
    {
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

        $response = $this->api->graph($integration, $query, ['id' => $gid]);

        if ($response['errors']) {
            throw new \RuntimeException('Failed to verify subscription: ' . json_encode($response['body']));
        }

        $subscription = $response['body']->data->node ?? null;
        $status       = strtoupper($subscription->status ?? '');

        if (! in_array($status, ['ACTIVE', 'ACCEPTED'])) {
            throw new \RuntimeException("Subscription not active (status: {$status})");
        }
    }

    /**
     * Cancel the active subscription via GraphQL.
     */
    public function cancelSubscription(Integration $integration): void
    {
        $user     = $integration->user;
        $chargeId = $user?->shopify_charge_id;

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

            $this->api->graph($integration, $mutation, ['id' => $chargeId]);
        }
    }
}
