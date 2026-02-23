<?php

namespace App\Http\Controllers\Api\Shopify;

use App\Http\Controllers\Controller;
use App\Services\AIFormService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AiGenerationController extends Controller
{
    public function __construct(private AIFormService $aiService) {}

    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'prompt'  => 'required|string|max:2000',
            'form_id' => 'nullable|integer|exists:forms,id',
        ]);

        try {
            $raw = $this->aiService->generate(
                Auth::user(),
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
        $validated = $request->validate([
            'prompt'          => 'required|string|max:2000',
            'existing_schema' => 'required|array',
            'form_id'         => 'nullable|integer|exists:forms,id',
        ]);

        try {
            $raw = $this->aiService->refine(
                Auth::user(),
                $validated['prompt'],
                $validated['existing_schema'],
                $validated['form_id'] ?? null
            );

            return response()->json(['data' => $this->mapToFormStructure($raw)]);
        } catch (\Throwable) {
            return response()->json(['error' => 'AI refinement failed. Please try again.'], 500);
        }
    }

    /**
     * Map the flat AI response into the form model structure.
     *
     * AI returns:  { title, fields, steps, styles, settings }
     * Form model:  { title, schema: { fields }, steps, styles, settings }
     */
    private function mapToFormStructure(array $raw): array
    {
        return [
            'title'    => $raw['title'] ?? 'Untitled Form',
            'schema'   => ['fields' => $raw['fields'] ?? []],
            'steps'    => $raw['steps'] ?? [],
            'styles'   => $raw['styles'] ?? [],
            'settings' => $raw['settings'] ?? [],
        ];
    }
}
