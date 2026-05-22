<?php

namespace App\Http\Controllers\Api\V1\AI;

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
            $result = $this->aiService->generate($user, $validated['prompt'], $validated['form_id'] ?? null);
            return response()->json(['data' => $this->mapToFormData($result)]);
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
            'prompt'                  => 'required|string|max:2000',
            'existing_component_code' => 'required|string',
            'form_id'                 => 'nullable|integer|exists:forms,id',
        ]);

        try {
            $result = $this->aiService->refine(
                $user,
                $validated['prompt'],
                $validated['existing_component_code'],
                $validated['form_id'] ?? null
            );
            return response()->json(['data' => $this->mapToFormData($result)]);
        } catch (\Throwable) {
            return response()->json(['error' => 'AI refinement failed. Please try again.'], 500);
        }
    }

    private function checkAiLimit(\App\Models\User $user): ?JsonResponse
    {
        $plan  = $user->plan ?? 'free';
        $limit = PlanLimits::get($plan, 'ai_tokens');
        $used  = PlanLimits::aiTokensUsedThisMonth($user);

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

    private function mapToFormData(array $result): array
    {
        return [
            'title'          => $result['meta']['title'] ?? 'Untitled Form',
            'html_content'   => $result['componentCode'],
            'meta'           => $result['meta'] ?? [],
            'stateVariables' => $result['stateVariablesUsed'] ?? [],
        ];
    }
}
