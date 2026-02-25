<?php

namespace App\Services;

use App\Models\User;

class PlanLimits
{
    const PLANS = [
        'free' => [
            'forms'       => 1,
            'submissions' => 50,
            'ai_tokens'   => 100_000,
            'label'       => 'Free',
        ],
        'starter' => [
            'forms'       => 5,
            'submissions' => 1_000,
            'ai_tokens'   => 1_000_000,
            'label'       => 'Starter',
        ],
        'growing' => [
            'forms'       => PHP_INT_MAX,
            'submissions' => PHP_INT_MAX,
            'ai_tokens'   => 10_000_000,
            'label'       => 'Growing',
        ],
    ];

    public static function get(string $plan, string $key): int
    {
        return self::PLANS[$plan][$key] ?? self::PLANS['free'][$key];
    }

    public static function forUser(User $user): array
    {
        return self::PLANS[$user->plan ?? 'free'] ?? self::PLANS['free'];
    }

    /**
     * Monthly AI tokens used by the user (summed from ai_generations).
     */
    public static function aiTokensUsedThisMonth(User $user): int
    {
        return (int) $user->aiGenerations()
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('tokens_used');
    }

    /**
     * Total submissions across all forms for this user.
     */
    public static function totalSubmissions(User $user): int
    {
        return $user->formResponses()->count();
    }
}
