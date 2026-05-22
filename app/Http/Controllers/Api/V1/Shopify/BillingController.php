<?php

namespace App\Http\Controllers\Api\V1\Shopify;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Services\Shopify\BillingService;
use App\Services\Shopify\JwtService;
use App\Services\PlanLimits;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BillingController extends Controller
{
    public function __construct(
        private BillingService $billing,
        private JwtService $jwt,
    ) {}

    private function resolveIntegration(Request $request): ?Integration
    {
        $user = Auth::user();
        if ($user) {
            return $user->integrations()->where('type', 'shopify')->first();
        }

        $raw = $request->bearerToken();
        if (! $raw) {
            return null;
        }

        $claims     = $this->jwt->decode($raw);
        $shopDomain = $claims ? $this->jwt->shopDomain($claims) : null;

        return $shopDomain ? Integration::where('name', $shopDomain)->first() : null;
    }

    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate(['plan' => 'required|in:starter,growing']);

        $integration = $this->resolveIntegration($request);
        if (! $integration) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $plan = $validated['plan'];

        if (($integration->user?->plan ?? 'free') === 'growing' && $plan === 'starter') {
            return response()->json(['error' => 'Downgrade is not supported. Please cancel first.'], 422);
        }

        try {
            $confirmationUrl = $this->billing->createSubscription($integration, $plan);
            return response()->json(['data' => ['confirmation_url' => $confirmationUrl]]);
        } catch (\Throwable $e) {
            \Log::error('BillingController@subscribe failed: ' . $e->getMessage());
            if (str_contains($e->getMessage(), 'session has expired')) {
                return response()->json(['error' => $e->getMessage()], 401);
            }
            return response()->json(['error' => 'Failed to create subscription. Please try again.'], 500);
        }
    }

    public function cancel(Request $request): JsonResponse
    {
        $integration = $this->resolveIntegration($request);
        if (! $integration) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        try {
            $this->billing->cancelSubscription($integration);
            return response()->json(['data' => ['plan' => 'free']]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to cancel subscription. Please try again.'], 500);
        }
    }

    public function current(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $plan   = $user->plan ?? 'free';
        $limits = PlanLimits::forUser($user);

        return response()->json([
            'data' => [
                'plan'                => $plan,
                'subscription_status' => $user->subscription_status,
                'limits'              => [
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
}
