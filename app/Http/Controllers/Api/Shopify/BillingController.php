<?php

namespace App\Http\Controllers\Api\Shopify;

use App\Http\Controllers\Controller;
use App\Services\BillingService;
use App\Services\PlanLimits;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Osiset\ShopifyApp\Contracts\Queries\Shop as IShopQuery;
use Osiset\ShopifyApp\Objects\Values\SessionToken;

class BillingController extends Controller
{
    public function __construct(
        private BillingService $billing,
        private IShopQuery $shopQuery,
    ) {}

    /**
     * Resolve the authenticated shop user.
     *
     * The verify.shopify middleware bypasses auth for any URI containing "/billing"
     * (a package-level bypass for Shopify's own billing callback). For our own billing
     * API routes we must manually decode the Bearer session token to get the user.
     */
    private function resolveUser(Request $request)
    {
        $user = Auth::user();
        if ($user) {
            return $user;
        }

        $raw = $request->bearerToken();
        if (! $raw) {
            return null;
        }

        try {
            $token = SessionToken::fromNative($raw);
            return $this->shopQuery->getByDomain($token->getShopDomain(), [], true);
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Create a Shopify recurring charge and return the confirmation URL.
     */
    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan' => 'required|in:starter,growing',
        ]);

        $user = $this->resolveUser($request);
        if (! $user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $plan = $validated['plan'];

        // Prevent downgrade via API
        if (($user->plan ?? 'free') === 'growing' && $plan === 'starter') {
            return response()->json(['error' => 'Downgrade is not supported. Please cancel first.'], 422);
        }

        try {
            $confirmationUrl = $this->billing->createSubscription($user, $plan);
            return response()->json(['data' => ['confirmation_url' => $confirmationUrl]]);
        } catch (\Throwable $e) {
            \Log::error('BillingController@subscribe failed: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create subscription. Please try again.'], 500);
        }
    }

    /**
     * Cancel the active subscription.
     */
    public function cancel(Request $request): JsonResponse
    {
        $user = $this->resolveUser($request);
        if (! $user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        try {
            $this->billing->cancelSubscription($user);
            return response()->json(['data' => ['plan' => 'free']]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to cancel subscription. Please try again.'], 500);
        }
    }

    /**
     * Return the current plan and usage stats.
     */
    public function current(Request $request): JsonResponse
    {
        $user = $this->resolveUser($request);
        if (! $user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $plan   = $user->plan ?? 'free';
        $limits = PlanLimits::forUser($user);

        $formsUsed       = $user->forms()->count();
        $submissionsUsed = PlanLimits::totalSubmissions($user);
        $aiTokensUsed    = PlanLimits::aiTokensUsedThisMonth($user);

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
                    'forms'       => $formsUsed,
                    'submissions' => $submissionsUsed,
                    'ai_tokens'   => $aiTokensUsed,
                ],
            ],
        ]);
    }
}
