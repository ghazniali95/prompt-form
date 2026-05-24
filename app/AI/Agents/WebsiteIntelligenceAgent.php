<?php

namespace App\AI\Agents;

use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Model;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Promptable;

#[Provider('openai')]
#[Model('gpt-4o-mini')]
#[MaxTokens(600)]
#[Timeout(30)]
class WebsiteIntelligenceAgent implements Agent
{
    use Promptable;

    public function instructions(): string
    {
        return <<<'PROMPT'
You are a brand analyst. Extract brand information from the provided website data.
Return ONLY valid JSON — no markdown fences, no explanation, no extra text.

JSON schema:
{
  "company_name": "string",
  "description": "one sentence describing what this company does",
  "primary_color": "#rrggbb or null",
  "secondary_color": "#rrggbb or null",
  "accent_color": "#rrggbb or null",
  "font_family": "font name or null"
}

Rules:
- Prefer colors found in the provided extracted colors list over guessing.
- If a color is unknown, return null — never invent a color.
- company_name: use og:site_name if available, otherwise clean up the page title.
- description: 1 sentence max, plain English, no marketing speak.
PROMPT;
    }
}
