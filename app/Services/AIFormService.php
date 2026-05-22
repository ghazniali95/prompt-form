<?php

namespace App\Services;

use App\Ai\Agents\HTMLFormBuilderAgent;
use App\Models\AiGeneration;
use App\Models\AiUsageLog;
use App\Models\Form;
use App\Models\User;

class AIFormService
{
    public function __construct(private FormConversationService $convService) {}

    public function chat(User $user, string $prompt, Form $form): array
    {
        $conv = $this->convService->getOrCreate($user, $form);

        if ($this->convService->shouldCompress($conv)) {
            $this->convService->compress($conv);
            $conv = $conv->fresh();
        }

        $history = $this->convService->loadMessages($conv);

        $generation = AiGeneration::create([
            'user_id' => $user->id,
            'form_id' => $form->id,
            'prompt'  => $prompt,
            'model'   => 'claude-sonnet-4-6',
            'status'  => 'pending',
        ]);

        try {
            $fullPrompt = $this->buildPrompt($prompt, $form->ulid);

            $response = HTMLFormBuilderAgent::make()->withMessages($history)->prompt($fullPrompt);

            $parsed = json_decode($response->text, true);

            if (! $parsed || ! isset($parsed['componentCode'])) {
                throw new \RuntimeException('AI returned an invalid JSON structure.');
            }

            $totalTokens = ($response->usage->promptTokens ?? 0)
                + ($response->usage->completionTokens ?? 0);

            $this->convService->appendTurn($conv, $prompt, $response->text, $totalTokens);

            AiUsageLog::create([
                'user_id'           => $user->id,
                'form_id'           => $form->id,
                'conversation_id'   => $conv->id,
                'provider'          => 'anthropic',
                'model'             => 'claude-sonnet-4-6',
                'purpose'           => 'form_builder',
                'prompt_tokens'     => $response->usage->promptTokens ?? 0,
                'completion_tokens' => $response->usage->completionTokens ?? 0,
                'cache_write_tokens'=> $response->usage->cacheWriteInputTokens ?? 0,
                'cache_read_tokens' => $response->usage->cacheReadInputTokens ?? 0,
                'reasoning_tokens'  => $response->usage->reasoningTokens ?? 0,
            ]);

            $generation->update([
                'tokens_used' => $totalTokens,
                'status'      => 'success',
            ]);

            return $parsed;
        } catch (\Throwable $e) {
            $generation->update([
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function generate(User $user, string $prompt, ?int $formId = null): array
    {
        if ($formId) {
            return $this->chat($user, $prompt, Form::findOrFail($formId));
        }

        return $this->callStateless($user, $prompt, null);
    }

    public function refine(User $user, string $prompt, string $existingCode, ?int $formId = null): array
    {
        if ($formId) {
            return $this->chat($user, $prompt, Form::findOrFail($formId));
        }

        $refinementPrompt = implode("\n", [
            'Here is the existing form component code:',
            '',
            $existingCode,
            '',
            'Apply the following changes: ' . $prompt,
            '',
            'Return the complete updated component. Keep all existing functionality unless explicitly asked to change it.',
        ]);

        return $this->callStateless($user, $refinementPrompt, null);
    }

    private function callStateless(User $user, string $prompt, ?string $formUlid): array
    {
        $generation = AiGeneration::create([
            'user_id' => $user->id,
            'form_id' => null,
            'prompt'  => $prompt,
            'model'   => 'claude-sonnet-4-6',
            'status'  => 'pending',
        ]);

        try {
            $fullPrompt = $this->buildPrompt($prompt, $formUlid);
            $response   = HTMLFormBuilderAgent::make()->prompt($fullPrompt);

            $parsed = json_decode($response->text, true);

            if (! $parsed || ! isset($parsed['componentCode'])) {
                throw new \RuntimeException('AI returned an invalid JSON structure.');
            }

            $totalTokens = ($response->usage->promptTokens ?? 0)
                + ($response->usage->completionTokens ?? 0);

            $generation->update(['tokens_used' => $totalTokens, 'status' => 'success']);

            return $parsed;
        } catch (\Throwable $e) {
            $generation->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
            throw $e;
        }
    }

    private function buildPrompt(string $userPrompt, ?string $formUlid): string
    {
        $submitUrl = $formUlid
            ? rtrim(config('app.url'), '/') . "/api/public/forms/{$formUlid}/submit"
            : '';

        return implode("\n", array_filter([
            $submitUrl ? "SUBMIT_URL: {$submitUrl}" : '',
            $userPrompt,
        ]));
    }
}
