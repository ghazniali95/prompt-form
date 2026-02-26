<?php

namespace App\Http\Controllers\Api\Shopify;

use App\Http\Controllers\Controller;
use App\Models\Form;
use App\Models\FormVersion;
use App\Services\PlanLimits;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FormController extends Controller
{
    public function index(): JsonResponse
    {
        $forms = Auth::user()->forms()->withCount('responses')->latest()->get();

        return response()->json(['data' => $forms]);
    }

    public function store(Request $request): JsonResponse
    {
        $user  = Auth::user();
        $plan  = $user->plan ?? 'free';
        $limit = PlanLimits::get($plan, 'forms');

        if ($user->forms()->count() >= $limit) {
            $planLabel = PlanLimits::PLANS[$plan]['label'] ?? 'current';
            return response()->json([
                'error'            => 'limit_reached',
                'message'          => "You've reached the {$limit}-form limit on your {$planLabel} plan.",
                'upgrade_required' => true,
            ], 422);
        }

        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'schema'      => 'nullable|array',
            'styles'      => 'nullable|array',
            'steps'       => 'nullable|array',
            'settings'    => 'nullable|array',
            'display'     => 'nullable|array',
            'image'       => 'nullable|array',
            'cookies'     => 'nullable|array',
            'post_submit' => 'nullable|array',
        ]);

        $form = $user->forms()->create($validated);

        return response()->json(['data' => $form], 201);
    }

    public function show(string $id): JsonResponse
    {
        $form = Auth::user()->forms()->findOrFail($id);

        return response()->json(['data' => $form]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $form = Auth::user()->forms()->findOrFail($id);

        $validated = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'schema'      => 'nullable|array',
            'styles'      => 'nullable|array',
            'steps'       => 'nullable|array',
            'settings'    => 'nullable|array',
            'display'     => 'nullable|array',
            'image'       => 'nullable|array',
            'cookies'     => 'nullable|array',
            'post_submit' => 'nullable|array',
        ]);

        $form->update($validated);

        return response()->json(['data' => $form]);
    }

    public function destroy(string $id): JsonResponse
    {
        Auth::user()->forms()->findOrFail($id)->delete();

        return response()->json(null, 204);
    }

    public function responses(string $id): JsonResponse
    {
        $form = Auth::user()->forms()->findOrFail($id);

        $responses = $form->responses()
            ->orderByDesc('submitted_at')
            ->get(['id', 'data', 'submitted_at']);

        $dailyCounts = $form->responses()
            ->where('submitted_at', '>=', now()->subDays(29)->startOfDay())
            ->selectRaw('DATE(submitted_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('count', 'date');

        $graph = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $graph[] = ['date' => $date, 'count' => (int) ($dailyCounts[$date] ?? 0)];
        }

        return response()->json([
            'data' => [
                'total'     => $responses->count(),
                'graph'     => $graph,
                'responses' => $responses,
            ],
        ]);
    }

    public function unpublish(string $id): JsonResponse
    {
        $form = Auth::user()->forms()->findOrFail($id);
        $form->update(['is_published' => false]);

        return response()->json(['data' => $form]);
    }

    public function duplicate(string $id): JsonResponse
    {
        $user  = Auth::user();
        $plan  = $user->plan ?? 'free';
        $limit = PlanLimits::get($plan, 'forms');

        if ($user->forms()->count() >= $limit) {
            $planLabel = PlanLimits::PLANS[$plan]['label'] ?? 'current';
            return response()->json([
                'error'            => 'limit_reached',
                'message'          => "You've reached the {$limit}-form limit on your {$planLabel} plan.",
                'upgrade_required' => true,
            ], 422);
        }

        $original = $user->forms()->findOrFail($id);

        $copy = $user->forms()->create([
            'title'    => 'Copy of ' . $original->title,
            'schema'   => $original->schema,
            'styles'   => $original->styles,
            'steps'    => $original->steps,
            'settings' => $original->settings,
        ]);

        $copy->loadCount('responses');

        return response()->json(['data' => $copy], 201);
    }

    public function publish(string $id): JsonResponse
    {
        $form = Auth::user()->forms()->findOrFail($id);

        // Save a version snapshot before publishing
        FormVersion::create([
            'form_id' => $form->id,
            'schema'  => $form->schema,
            'styles'  => $form->styles,
            'steps'   => $form->steps,
        ]);

        $form->update(['is_published' => true]);

        return response()->json(['data' => $form]);
    }
}
