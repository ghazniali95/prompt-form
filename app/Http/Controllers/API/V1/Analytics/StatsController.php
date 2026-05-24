<?php

namespace App\Http\Controllers\API\V1\Analytics;

use App\Http\Controllers\Controller;
use App\Services\PlanLimits;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class StatsController extends Controller
{
    public function index(): JsonResponse
    {
        $user   = Auth::user();
        $plan   = $user->plan ?? 'free';
        $limits = PlanLimits::forUser($user);

        $totalForms        = $user->forms()->count();
        $publishedForms    = $user->forms()->where('is_published', true)->count();
        $integrationsCount = $user->integrations()->count();
        $totalSubmissions = PlanLimits::totalSubmissions($user);

        $submissionsThisMonth = $user->formResponses()
            ->whereMonth('submitted_at', now()->month)
            ->whereYear('submitted_at', now()->year)
            ->count();

        $submissionLimit = $limits['submissions'];
        $formLimit       = $limits['forms'];
        $aiTokenLimit    = $limits['ai_tokens'];
        $aiTokensUsed    = PlanLimits::aiTokensUsedThisMonth($user);
        $aiUsagePct      = $aiTokenLimit > 0
            ? min(100, (int) round(($aiTokensUsed / $aiTokenLimit) * 100))
            : 0;

        return response()->json([
            'data' => [
                'plan'                   => $plan,
                'total_forms'            => $totalForms,
                'published_forms'        => $publishedForms,
                'draft_forms'            => $totalForms - $publishedForms,
                'forms_limit'            => $formLimit === PHP_INT_MAX ? null : $formLimit,
                'total_submissions'      => $totalSubmissions,
                'submissions_this_month' => $submissionsThisMonth,
                'submissions_limit'      => $submissionLimit === PHP_INT_MAX ? null : $submissionLimit,
                'submissions_left'       => $submissionLimit === PHP_INT_MAX
                    ? null
                    : max(0, $submissionLimit - $totalSubmissions),
                'ai_tokens_used'         => $aiTokensUsed,
                'ai_tokens_limit'        => $aiTokenLimit,
                'ai_usage_pct'           => $aiUsagePct,
                'ai_limit_reached'       => $aiTokensUsed >= $aiTokenLimit,
                'integrations_count'     => $integrationsCount,
            ],
        ]);
    }
}
