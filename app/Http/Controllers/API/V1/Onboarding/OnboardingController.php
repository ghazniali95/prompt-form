<?php

namespace App\Http\Controllers\API\V1\Onboarding;

use App\Http\Controllers\Controller;
use App\Jobs\CaptureWebsiteScreenshot;
use App\Models\Theme;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OnboardingController extends Controller
{
    public function complete(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Store merchants (Shopify / WooCommerce) already have a known storefront
        // URL — we never ask them for it and ignore any client-supplied value.
        $known = $user->knownWebsiteUrl();

        if ($known) {
            $url = $known;
        } else {
            $request->validate(['website_url' => 'required|string|max:500']);

            $url = $this->normaliseUrl($request->input('website_url'));

            if (! $this->looksLikeWebsiteUrl($url)) {
                return response()->json([
                    'error' => "This link doesn't look right. Please enter a valid website URL, e.g. mesh99.com.",
                ], 422);
            }
        }

        $existing = Theme::where('user_id', $user->id)->first();
        $urlChanged = $url !== ($existing->website_url ?? null);

        $theme = Theme::updateOrCreate(
            ['user_id' => $user->id],
            ['website_url' => $url, 'is_active' => true]
        );

        $user->update(['onboarding_completed' => true]);

        // Capture a screenshot in the background when the URL is new or changed;
        // AI form generation uses it as visual brand context.
        if ($urlChanged || ! $theme->screenshot_url) {
            $theme->update(['screenshot_status' => 'pending', 'screenshot_url' => null]);
            CaptureWebsiteScreenshot::dispatch($theme);
        }

        return response()->json(['redirect' => route('dashboard')]);
    }

    public function skip(): JsonResponse
    {
        Auth::user()->update(['onboarding_completed' => true]);

        return response()->json(['redirect' => route('dashboard')]);
    }

    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => [
                'needs_onboarding' => ! $user->onboarding_completed,
                // When set, we already know the merchant's site — the UI skips
                // the URL input and captures the screenshot automatically.
                'known_website_url' => $user->knownWebsiteUrl(),
            ],
        ]);
    }

    /**
     * Accept the URL in whatever shape the user typed it — "mesh99.com",
     * "www.mesh99.com", "https://mesh99.com/" — by prepending a scheme when
     * missing and trimming a trailing slash.
     */
    private function normaliseUrl(string $url): string
    {
        $url = trim($url);
        if (! preg_match('#^https?://#i', $url)) {
            $url = 'https://'.$url;
        }

        return rtrim($url, '/');
    }

    /**
     * Only reject a URL when it's clearly wrong: it must have an http(s) scheme,
     * a host with a real domain (a dot + TLD), and that host must resolve in DNS.
     * A typo like "mesh99.con" fails DNS and is caught here.
     */
    private function looksLikeWebsiteUrl(string $url): bool
    {
        $host = parse_url($url, PHP_URL_HOST);

        if (! $host) {
            return false;
        }

        // Must look like a real domain: labels + a TLD of at least two letters.
        if (! preg_match('/^([a-z0-9]([a-z0-9\-]*[a-z0-9])?\.)+[a-z]{2,}$/i', $host)) {
            return false;
        }

        // A domain that doesn't resolve at all is "totally wrong".
        return checkdnsrr($host, 'A') || checkdnsrr($host, 'AAAA');
    }
}
