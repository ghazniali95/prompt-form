<?php

namespace App\Http\Controllers\API\V1\Analytics;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AnalyticsController extends Controller
{
    /**
     * Overview analytics for the authenticated user.
     *
     * Returns:
     *   trend           — daily submission counts for the last N days (default 30)
     *   forms_breakdown — every form with submission count + share %
     *   top_form        — form with the most submissions
     */
    public function overview(Request $request): JsonResponse
    {
        $user = Auth::user();
        $days = min((int) $request->input('days', 30), 90);

        // ── Daily submission trend ─────────────────────────────────────────────

        $dailyCounts = $user->formResponses()
            ->where('submitted_at', '>=', now()->subDays($days - 1)->startOfDay())
            ->selectRaw('DATE(submitted_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('count', 'date');

        $trend = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date    = now()->subDays($i)->format('Y-m-d');
            $trend[] = [
                'date'  => $date,
                'label' => now()->subDays($i)->format('M j'),
                'count' => (int) ($dailyCounts[$date] ?? 0),
            ];
        }

        // ── Per-form breakdown ─────────────────────────────────────────────────

        $forms = $user->forms()
            ->withCount('responses')
            ->orderByDesc('responses_count')
            ->get(['id', 'ulid', 'title', 'is_published', 'updated_at']);

        $totalSubmissions = $forms->sum('responses_count');

        $formsBreakdown = $forms->map(fn ($f) => [
            'id'          => $f->id,
            'ulid'        => $f->ulid,
            'title'       => $f->title,
            'status'      => $f->is_published ? 'published' : 'draft',
            'submissions' => $f->responses_count,
            'share'       => $totalSubmissions > 0
                ? round($f->responses_count / $totalSubmissions * 100, 1)
                : 0,
            'updated_at'  => $f->updated_at->toISOString(),
        ])->values();

        return response()->json([
            'data' => [
                'trend'           => $trend,
                'forms_breakdown' => $formsBreakdown,
                'top_form'        => $formsBreakdown->first(),
                'total_submissions' => $totalSubmissions,
            ],
        ]);
    }
}
