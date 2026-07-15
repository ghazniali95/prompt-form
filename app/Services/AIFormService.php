<?php

namespace App\Services;

use App\AI\Agents\HTMLFormBuilderAgent;
use App\Models\AiGeneration;
use App\Models\AiUsageLog;
use App\Models\Form;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Ai\Files\Image;

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
            'prompt' => $prompt,
            'model' => 'claude-sonnet-4-6',
            'status' => 'pending',
        ]);

        try {
            $fullPrompt = $this->buildPrompt($prompt, $form->ulid);

            $agent = HTMLFormBuilderAgent::make()->withMessages($history);

            $attachments = $this->brandAttachments($user);
            if ($attachments) {
                $agent->withBrandScreenshot();
            }

            $response = $agent->prompt($fullPrompt, $attachments);

            $parsed = $this->decodeComponentJson($response->text);

            $totalTokens = ($response->usage->promptTokens ?? 0)
                + ($response->usage->completionTokens ?? 0);

            $this->convService->appendTurn($conv, $prompt, $response->text, $totalTokens);

            AiUsageLog::create([
                'user_id' => $user->id,
                'form_id' => $form->id,
                'conversation_id' => $conv->id,
                'provider' => 'anthropic',
                'model' => 'claude-sonnet-4-6',
                'purpose' => 'form_builder',
                'prompt_tokens' => $response->usage->promptTokens ?? 0,
                'completion_tokens' => $response->usage->completionTokens ?? 0,
                'cache_write_tokens' => $response->usage->cacheWriteInputTokens ?? 0,
                'cache_read_tokens' => $response->usage->cacheReadInputTokens ?? 0,
                'reasoning_tokens' => $response->usage->reasoningTokens ?? 0,
            ]);

            $generation->update([
                'tokens_used' => $totalTokens,
                'status' => 'success',
            ]);

            return $parsed;
        } catch (\Throwable $e) {
            $generation->update([
                'status' => 'failed',
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
            'Apply the following changes: '.$prompt,
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
            'prompt' => $prompt,
            'model' => 'claude-sonnet-4-6',
            'status' => 'pending',
        ]);

        try {
            $fullPrompt = $this->buildPrompt($prompt, $formUlid);

            $agent = HTMLFormBuilderAgent::make();

            $attachments = $this->brandAttachments($user);
            if ($attachments) {
                $agent->withBrandScreenshot();
            }

            $response = $agent->prompt($fullPrompt, $attachments);

            $parsed = $this->decodeComponentJson($response->text);

            $totalTokens = ($response->usage->promptTokens ?? 0)
                + ($response->usage->completionTokens ?? 0);

            $generation->update(['tokens_used' => $totalTokens, 'status' => 'success']);

            return $parsed;
        } catch (\Throwable $e) {
            $generation->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Decode the agent's JSON payload, tolerating a stray markdown code fence
     * (```json … ```) or surrounding prose the model occasionally adds.
     */
    private function decodeComponentJson(string $text): array
    {
        $text = trim($text);

        // Strip a leading/trailing markdown fence if present.
        if (str_starts_with($text, '```')) {
            $text = preg_replace('/^```[a-zA-Z]*\s*|\s*```$/', '', $text);
        }

        $parsed = json_decode($text, true);

        // Fall back to the outermost { … } if there's leading/trailing prose.
        if (! is_array($parsed)) {
            $start = strpos($text, '{');
            $end = strrpos($text, '}');
            if ($start !== false && $end !== false && $end > $start) {
                $parsed = json_decode(substr($text, $start, $end - $start + 1), true);
            }
        }

        if (! is_array($parsed) || ! isset($parsed['componentCode'])) {
            throw new \RuntimeException('AI returned an invalid JSON structure.');
        }

        return $parsed;
    }

    private function buildPrompt(string $userPrompt, ?string $formUlid): string
    {
        $submitUrl = $formUlid
            ? rtrim(config('app.url'), '/')."/api/public/forms/{$formUlid}/submit"
            : '';

        return implode("\n", array_filter([
            $submitUrl ? "SUBMIT_URL: {$submitUrl}" : '',
            $userPrompt,
        ]));
    }

    /**
     * The merchant's website screenshot, as an image attachment for the model
     * to derive brand styling from. Empty when no screenshot has been captured.
     *
     * Sent as base64 read straight off the storage disk (not a URL source), so
     * it works regardless of whether the disk is publicly reachable.
     *
     * @return array<int, \Laravel\Ai\Files\Image>
     */
    private function brandAttachments(User $user): array
    {
        $theme = $user->theme;

        if (! $theme || $theme->screenshot_status !== 'done' || ! $theme->screenshot_url) {
            return [];
        }

        $disk = config('screenshot.disk');
        $dir = trim((string) config('screenshot.directory'), '/');

        // Derive the disk-relative key from the stored URL via the directory
        // marker, so it survives the host changing (e.g. a new ngrok URL in dev).
        $urlPath = parse_url($theme->screenshot_url, PHP_URL_PATH) ?: '';
        $key = $dir.'/'.ltrim(Str::after($urlPath, '/'.$dir.'/'), '/');

        if (! Storage::disk($disk)->exists($key)) {
            return [];
        }

        return [Image::fromStorage($key, $disk)];
    }
}
