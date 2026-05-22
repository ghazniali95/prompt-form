<?php

namespace App\Services\Shopify;

use App\Models\Integration;
use Illuminate\Support\Facades\Http;

class ApiService
{
    /**
     * Execute a Shopify Admin GraphQL query or mutation.
     *
     * Returns an array matching the shape gnikyt/basic-shopify-api used to return
     * so existing callers (BillingService) need no structural changes:
     *   ['errors' => bool, 'status' => int, 'body' => stdClass]
     */
    public function graph(Integration $integration, string $query, array $variables = []): array
    {
        $version  = config('services.shopify.api_version');
        $endpoint = "https://{$integration->name}/admin/api/{$version}/graphql.json";

        $response = Http::withHeaders([
            'X-Shopify-Access-Token' => $integration->token,
            'Content-Type'           => 'application/json',
        ])->post($endpoint, [
            'query'     => $query,
            'variables' => $variables,
        ]);

        return [
            'errors' => ! $response->successful(),
            'status' => $response->status(),
            'body'   => json_decode($response->body()),
        ];
    }
}
