<?php

namespace App\Http\Controllers\Api\V1\Forms;

use App\Http\Controllers\Controller;
use App\Services\AIFormService;
use App\Services\JsxCompilerService;
use App\Services\PlanLimits;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FormChatController extends Controller
{
    public function __construct(
        private AIFormService $aiService,
        private JsxCompilerService $compiler,
    ) {}

    public function messages(string $id): JsonResponse
    {
        $form = Auth::user()->forms()->findOrFail($id);

        $conversation = $form->conversations()
            ->where('user_id', Auth::id())
            ->with('messages')
            ->first();

        if (! $conversation) {
            return response()->json([
                'data'         => [],
                'html_content' => $form->html_content,
            ]);
        }

        $messages = $conversation->messages->map(fn ($m) => [
            'id'      => $m->id,
            'role'    => $m->role,
            'content' => $m->role === 'assistant'
                ? 'Done! Your form has been updated. Check the preview →'
                : $m->content,
        ]);

        return response()->json([
            'data'         => $messages,
            'html_content' => $form->html_content,
        ]);
    }

    public function chat(Request $request, string $id): JsonResponse
    {
        $user = Auth::user();

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

        $form = $user->forms()->findOrFail($id);

        $validated = $request->validate([
            'message' => 'required|string|max:4000',
        ]);

        try {
            $result = $this->aiService->chat($user, $validated['message'], $form);

            $componentCode = $result['componentCode'];
            $meta          = $result['meta'] ?? [];

            $reply = empty($form->html_content)
                ? "Done! I've built your form. Check the preview on the right."
                : "Done! Your form has been updated. Check the preview on the right.";

            $form->update([
                'html_content'     => $componentCode,
                'compiled_content' => $this->compiler->compile($componentCode),
                'title'            => ! empty($meta['title']) ? $meta['title'] : $form->title,
                'layout_type'      => ! empty($meta['layoutType']) ? strtolower($meta['layoutType']) : $form->layout_type,
            ]);

            return response()->json([
                'data' => [
                    'reply'        => $reply,
                    'html_content' => $componentCode,
                    'meta'         => $meta,
                ],
            ]);
        } catch (\Throwable) {
            return response()->json(['error' => 'AI generation failed. Please try again.'], 500);
        }
    }
}
