<?php

namespace App\Services;

use App\Models\AiConversation;
use App\Models\Form;
use App\Models\User;
use Illuminate\Support\Facades\Http;

class FormConversationService
{
    const COMPRESSION_THRESHOLD = 60_000;

    public function getOrCreate(User $user, Form $form): AiConversation
    {
        return AiConversation::firstOrCreate([
            'user_id'          => $user->id,
            'conversable_type' => Form::class,
            'conversable_id'   => $form->id,
        ]);
    }

    public function loadMessages(AiConversation $conv): array
    {
        $conv->load('messages');

        return $conv->messages->map(fn ($m) => [
            'role'    => $m->role,
            'content' => $m->content,
        ])->all();
    }

    public function appendTurn(
        AiConversation $conv,
        string $userMessage,
        string $assistantText,
        int $tokens
    ): void {
        $conv->messages()->create(['role' => 'user', 'content' => $userMessage, 'tokens_used' => 0]);
        $conv->messages()->create(['role' => 'assistant', 'content' => $assistantText, 'tokens_used' => $tokens]);

        $conv->increment('message_count', 2);
        $conv->increment('total_tokens', $tokens);
    }

    public function shouldCompress(AiConversation $conv): bool
    {
        return $conv->total_tokens >= self::COMPRESSION_THRESHOLD;
    }

    public function compress(AiConversation $conv): void
    {
        $messages = $conv->messages()->orderBy('id')->get();

        if ($messages->isEmpty()) {
            return;
        }

        $transcript = $messages
            ->map(fn ($m) => strtoupper($m->role) . ': ' . $m->content)
            ->join("\n\n");

        $apiKey = config('ai.providers.anthropic.key');

        try {
            $response = Http::timeout(30)->withHeaders([
                'x-api-key'         => $apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ])->post('https://api.anthropic.com/v1/messages', [
                'model'      => 'claude-haiku-4-5-20251001',
                'max_tokens' => 1024,
                'system'     => 'You are a conversation summarizer. Summarize the following form-building conversation into a concise context block that preserves all form structure decisions, component code, field types, styling, and behavior decisions. The summary will be injected as prior context for future AI messages.',
                'messages'   => [
                    ['role' => 'user', 'content' => "Summarize this conversation:\n\n{$transcript}"],
                ],
            ]);

            $summary = $response->json('content.0.text') ?? 'Previous conversation compressed.';
        } catch (\Throwable) {
            $summary = 'Previous conversation was compressed. Key form decisions may have been made prior to this point.';
        }

        $conv->messages()->delete();
        $conv->messages()->create(['role' => 'user', 'content' => 'What form have we built so far?', 'tokens_used' => 0]);
        $conv->messages()->create(['role' => 'assistant', 'content' => $summary, 'tokens_used' => 0]);

        $conv->update([
            'total_tokens'        => 0,
            'message_count'       => 2,
            'last_compressed_at'  => now(),
            'compression_summary' => $summary,
        ]);
    }
}
