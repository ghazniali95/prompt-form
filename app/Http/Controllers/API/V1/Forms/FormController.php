<?php

namespace App\Http\Controllers\API\V1\Forms;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\FormResource;
use App\Models\Form;
use App\Services\JsxCompilerService;
use App\Services\PlanLimits;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FormController extends Controller
{
    public function __construct(private JsxCompilerService $compiler) {}

    public function index(Request $request): JsonResponse
    {
        $query = Auth::user()->forms()->withCount('responses');

        if ($search = $request->string('search')->trim()->value()) {
            $query->where('title', 'like', "%{$search}%");
        }

        $perPage = min((int) $request->input('per_page', 20), 100);
        $forms   = $query->latest()->paginate($perPage);

        return FormResource::collection($forms)->response();
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
            'title'        => 'required|string|max:255',
            'html_content' => 'nullable|string',
        ]);

        $form = $user->forms()->create($validated);
        $form->loadCount('responses');

        return (new FormResource($form))->response()->setStatusCode(201);
    }

    public function show(string $id): JsonResponse
    {
        $form = $this->resolveForm($id);

        return (new FormResource($form))->response();
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $form = $this->resolveForm($id);

        $validated = $request->validate([
            'title'        => 'sometimes|string|max:255',
            'html_content' => 'nullable|string',
            'is_published' => 'sometimes|boolean',
            'layout_type'  => 'sometimes|string|in:single,multi',
        ]);

        if (isset($validated['html_content'])) {
            $validated['compiled_content'] = $this->compiler->compile($validated['html_content']);
        }

        $form->update($validated);
        $form->loadCount('responses');

        return (new FormResource($form))->response();
    }

    public function destroy(string $id): JsonResponse
    {
        $this->resolveForm($id)->delete();

        return response()->json(null, 204);
    }

    public function publish(string $id): JsonResponse
    {
        $form = $this->resolveForm($id);
        $form->update(['is_published' => true]);
        $form->loadCount('responses');

        return (new FormResource($form))->response();
    }

    public function unpublish(string $id): JsonResponse
    {
        $form = $this->resolveForm($id);
        $form->update(['is_published' => false]);
        $form->loadCount('responses');

        return (new FormResource($form))->response();
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

        $original = $this->resolveForm($id);

        $copy = $user->forms()->create([
            'title'            => 'Copy of ' . $original->title,
            'html_content'     => $original->html_content,
            'compiled_content' => $original->compiled_content,
        ]);

        $copy->loadCount('responses');

        return (new FormResource($copy))->response()->setStatusCode(201);
    }

    public function responses(string $id): JsonResponse
    {
        $form = $this->resolveForm($id);

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
            $date    = now()->subDays($i)->format('Y-m-d');
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

    // Resolve a form by numeric ID or ULID (26-char non-numeric string).
    private function resolveForm(string $id): Form
    {
        $query = Auth::user()->forms();

        return is_numeric($id)
            ? $query->findOrFail($id)
            : $query->where('ulid', $id)->firstOrFail();
    }
}
