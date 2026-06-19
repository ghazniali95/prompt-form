<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class RecaptchaService
{
    /**
     * Verify a reCAPTCHA v3 token against Google's siteverify endpoint.
     *
     * Fails open when no secret is configured (local dev without keys) and
     * fails closed when a secret is set but the token is missing/invalid,
     * the action doesn't match, or the score is below the threshold.
     */
    public function verify(?string $token, string $expectedAction): bool
    {
        if (! config('services.recaptcha.secret')) {
            return true;
        }

        if (! $token) {
            return false;
        }

        $result = Http::asForm()
            ->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret'   => config('services.recaptcha.secret'),
                'response' => $token,
            ])
            ->json();

        return ($result['success'] ?? false)
            && ($result['action'] ?? null) === $expectedAction
            && ($result['score'] ?? 0) >= (float) config('services.recaptcha.threshold');
    }
}
