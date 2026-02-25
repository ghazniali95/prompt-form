<?php

namespace App\Http\Controllers\Api\Shopify;

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

        $totalForms       = $user->forms()->count();
        $totalSubmissions = PlanLimits::totalSubmissions($user);

        $submissionLimit = $limits['submissions'];
        $submissionsLeft = $submissionLimit === PHP_INT_MAX
            ? null
            : max(0, $submissionLimit - $totalSubmissions);

        return response()->json([
            'data' => [
                'plan'             => $plan,
                'total_forms'      => $totalForms,
                'total_submissions' => $totalSubmissions,
                'plan_limit'       => $submissionLimit === PHP_INT_MAX ? null : $submissionLimit,
                'submissions_left' => $submissionsLeft,
            ],
        ]);
    }
}
