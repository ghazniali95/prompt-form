<?php

namespace App\Http\Controllers\API\V1\Onboarding;

use App\Http\Controllers\Controller;
use App\Jobs\CaptureWebsiteScreenshot;
use App\Models\Theme;
use App\Services\WebsiteIntelligenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class OnboardingController extends Controller
{
    public function __construct(private WebsiteIntelligenceService $intelligence) {}

    public function scan(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Store merchants (Shopify / WooCommerce) already have a known storefront
        // URL — we never ask them for it, and we ignore any client-supplied value.
        $known = $user->knownWebsiteUrl();

        if ($known) {
            $url = $known;
        } else {
            $request->validate(['url' => 'required|string|max:500']);

            $url = $this->normaliseUrl($request->input('url'));

            if (! $this->looksLikeWebsiteUrl($url)) {
                return response()->json([
                    'error' => "This link doesn't look right. Please enter a valid website URL, e.g. mesh99.com.",
                ], 422);
            }
        }

        try {
            $result = $this->intelligence->scan($url);

            // Strip internal hints before sending to frontend
            unset($result['_colors_hint'], $result['_theme_color'], $result['_og_description'], $result['_title']);

            return response()->json(['data' => $result]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to scan the website. Please check the URL and try again.'], 422);
        }
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

    public function complete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'website_url' => 'nullable|string|max:500',
            'company_name' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'logo_url' => 'nullable|url|max:1000',
            'favicon_url' => 'nullable|url|max:1000',
            'primary_color' => 'nullable|string|max:10',
            'secondary_color' => 'nullable|string|max:10',
            'accent_color' => 'nullable|string|max:10',
            'font_family' => 'nullable|string|max:100',
        ]);

        $user = Auth::user();

        // For store merchants the storefront URL is authoritative — never trust
        // a client-supplied value.
        if ($known = $user->knownWebsiteUrl()) {
            $validated['website_url'] = $known;
        }

        $existing = Theme::where('user_id', $user->id)->first();
        $urlChanged = ($validated['website_url'] ?? null) !== ($existing->website_url ?? null);

        $theme = Theme::updateOrCreate(
            ['user_id' => $user->id],
            array_merge($validated, ['is_active' => true])
        );

        $user->update(['onboarding_completed' => true]);

        // Capture a screenshot in the background when we have a URL and either
        // it's the first time or the URL changed since the last capture.
        if (! empty($validated['website_url']) && ($urlChanged || ! $theme->screenshot_url)) {
            $theme->update(['screenshot_status' => 'pending', 'screenshot_url' => null]);
            CaptureWebsiteScreenshot::dispatch($theme);
        }

        return response()->json(['redirect' => route('dashboard')]);
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'logo' => 'required|file|image|max:4096|mimes:jpeg,png,webp,svg,gif',
        ]);

        $file = $request->file('logo');
        $extension = $file->getClientOriginalExtension();
        $path = 'logos/'.Auth::id().'/'.Str::uuid().'.'.$extension;

        Storage::disk('s3')->put($path, file_get_contents($file), 'public');

        $url = Storage::disk('s3')->url($path);

        return response()->json(['data' => ['url' => $url]]);
    }

    public function skip(): JsonResponse
    {
        Auth::user()->update(['onboarding_completed' => true]);

        return response()->json(['redirect' => route('dashboard')]);
    }

    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        $known = $user->knownWebsiteUrl();

        return response()->json([
            'data' => [
                'needs_onboarding' => ! $user->onboarding_completed,
                // When set, we already know the merchant's site — the UI should
                // skip the URL step and scan it automatically.
                'known_website_url' => $known,
            ],
        ]);
    }
}
