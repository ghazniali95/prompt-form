<?php

namespace App\Services;

use App\Models\AiGeneration;
use App\Models\User;
use OpenAI\Laravel\Facades\OpenAI;

class AIFormService
{
    private string $systemPrompt = <<<'PROMPT'
You are a form builder AI. Your job is to generate a JSON form schema based on the user's description.

You MUST return ONLY valid JSON with this exact structure:
{
  "title": "string",
  "fields": [
    {
      "id": "field_1",
      "type": "text|email|tel|number|textarea|select|radio|checkbox|date",
      "label": "string",
      "placeholder": "string|null",
      "required": true|false,
      "options": ["option1", "option2"] // only for select/radio/checkbox
      "validations": {
        "minLength": number|null,
        "maxLength": number|null,
        "min": number|null,
        "max": number|null,
        "pattern": "regex string|null"
      }
    }
  ],
  "steps": [
    {
      "title": "string",
      "fields": ["field_1", "field_2"]
    }
  ],
  "styles": {
    "primaryColor": "#hex",
    "borderRadius": "4px|8px|12px",
    "fontFamily": "sans-serif|serif|monospace"
  },
  "settings": {
    "submitButtonText": "string",
    "successMessage": "string",
    "redirectUrl": null
  }
}

Rules:
- Always generate a "title" for the form.
- Always generate at least one field.
- If no steps are specified, put ALL fields in a single step called "Main".
- If no styling is described, use primaryColor "#5C6AC4" and borderRadius "8px".
- Return ONLY the JSON object, no explanation, no markdown code blocks.
PROMPT;

    public function generate(User $shop, string $prompt, ?int $formId = null): array
    {
        $generation = AiGeneration::create([
            'shop_id' => $shop->id,
            'form_id' => $formId,
            'prompt'  => $prompt,
            'status'  => 'pending',
        ]);

        try {
            $response = OpenAI::chat()->create([
                'model'    => config('openai.model', 'gpt-4o'),
                'messages' => [
                    ['role' => 'system', 'content' => $this->systemPrompt],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'response_format' => ['type' => 'json_object'],
            ]);

            $schema = json_decode($response->choices[0]->message->content, true);
            $tokensUsed = $response->usage->totalTokens ?? 0;

            $generation->update([
                'generated_schema' => $schema,
                'tokens_used'      => $tokensUsed,
                'status'           => 'success',
            ]);

            return $schema;
        } catch (\Throwable $e) {
            $generation->update([
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function refine(User $shop, string $prompt, array $existingForm, ?int $formId = null): array
    {
        // Convert stored form structure back to the flat AI format before sending
        $flatSchema = [
            'title'    => $existingForm['title'] ?? '',
            'fields'   => $existingForm['schema']['fields'] ?? [],
            'steps'    => $existingForm['steps'] ?? [],
            'styles'   => $existingForm['styles'] ?? [],
            'settings' => $existingForm['settings'] ?? [],
        ];

        $refinementPrompt = "Here is the current form schema:\n" . json_encode($flatSchema, JSON_PRETTY_PRINT)
            . "\n\nApply the following changes: " . $prompt;

        return $this->generate($shop, $refinementPrompt, $formId);
    }
}
