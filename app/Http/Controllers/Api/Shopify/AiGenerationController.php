<?php

namespace App\Http\Controllers\Api\Shopify;

use App\Http\Controllers\Controller;
use App\Services\AIFormService;
use App\Services\PlanLimits;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AiGenerationController extends Controller
{
    public function __construct(private AIFormService $aiService) {}

    public function generate(Request $request): JsonResponse
    {
        $user = Auth::user();

        $limitError = $this->checkAiLimit($user);
        if ($limitError) return $limitError;

        $validated = $request->validate([
            'prompt'  => 'required|string|max:2000',
            'form_id' => 'nullable|integer|exists:forms,id',
        ]);

        try {
            $raw = $this->aiService->generate(
                $user,
                $validated['prompt'],
                $validated['form_id'] ?? null
            );

            return response()->json(['data' => $this->mapToFormStructure($raw)]);
        } catch (\Throwable) {
            return response()->json(['error' => 'AI generation failed. Please try again.'], 500);
        }
    }

    public function refine(Request $request): JsonResponse
    {
        $user = Auth::user();

        $limitError = $this->checkAiLimit($user);
        if ($limitError) return $limitError;

        $validated = $request->validate([
            'prompt'          => 'required|string|max:2000',
            'existing_schema' => 'required|array',
            'form_id'         => 'nullable|integer|exists:forms,id',
        ]);

        try {
            $raw = $this->aiService->refine(
                $user,
                $validated['prompt'],
                $validated['existing_schema'],
                $validated['form_id'] ?? null
            );

            return response()->json(['data' => $this->mapToFormStructure($raw)]);
        } catch (\Throwable) {
            return response()->json(['error' => 'AI refinement failed. Please try again.'], 500);
        }
    }

    private function checkAiLimit(\App\Models\User $user): ?JsonResponse
    {
        $plan      = $user->plan ?? 'free';
        $limit     = PlanLimits::get($plan, 'ai_tokens');
        $used      = PlanLimits::aiTokensUsedThisMonth($user);

        if ($used >= $limit) {
            $planLabel = PlanLimits::PLANS[$plan]['label'] ?? 'current';
            return response()->json([
                'error'            => 'ai_limit_reached',
                'message'          => "You've used all your AI credits for this month on the {$planLabel} plan.",
                'upgrade_required' => true,
            ], 422);
        }

        return null;
    }

    /**
     * Map the flat AI response into the form model structure.
     *
     * AI returns:  { title, display, image, fields, steps, cookies, post_submit, styles, settings }
     * Form model:  { title, schema: { fields }, steps, styles, settings, display, image, cookies, post_submit }
     */
    private function mapToFormStructure(array $raw): array
    {
        $mapped = [
            'title'    => $raw['title'] ?? 'Untitled Form',
            'schema'   => ['fields' => $raw['fields'] ?? []],
            'steps'    => $raw['steps'] ?? [],
            'styles'   => $raw['styles'] ?? [],
            'settings' => $raw['settings'] ?? [],
        ];

        if (!empty($raw['display'])) {
            $mapped['display'] = $raw['display'];
        }

        if (!empty($raw['image']['url'])) {
            $mapped['image'] = $raw['image'];
        }

        if (!empty($raw['cookies'])) {
            $mapped['cookies'] = $raw['cookies'];
        }

        if (!empty($raw['post_submit'])) {
            $mapped['post_submit'] = $raw['post_submit'];
        }

        return $mapped;
    }
}
