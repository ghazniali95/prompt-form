<?php

namespace App\Http\Controllers\Api\Shopify;

use App\Http\Controllers\Controller;
use App\Services\BillingService;
use App\Services\PlanLimits;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BillingController extends Controller
{
    public function __construct(private BillingService $billing) {}

    /**
     * Create a Shopify recurring charge and return the confirmation URL.
     */
    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan' => 'required|in:starter,growing',
        ]);

        $user = Auth::user();
        $plan = $validated['plan'];

        // Prevent downgrade via API
        if ($user->plan === 'growing' && $plan === 'starter') {
            return response()->json(['error' => 'Downgrade is not supported. Please cancel first.'], 422);
        }

        try {
            $confirmationUrl = $this->billing->createSubscription($user, $plan);
            return response()->json(['data' => ['confirmation_url' => $confirmationUrl]]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to create subscription. Please try again.'], 500);
        }
    }

    /**
     * Cancel the active subscription.
     */
    public function cancel(): JsonResponse
    {
        $user = Auth::user();

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
    public function current(): JsonResponse
    {
        $user = Auth::user();
        $plan = $user->plan ?? 'free';
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
