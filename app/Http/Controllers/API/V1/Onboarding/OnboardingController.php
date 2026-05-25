<?php

namespace App\Http\Controllers\API\V1\Onboarding;

use App\Http\Controllers\Controller;
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
        $request->validate(['url' => 'required|string|max:500']);

        try {
            $result = $this->intelligence->scan($request->input('url'));

            // Strip internal hints before sending to frontend
            unset($result['_colors_hint'], $result['_theme_color'], $result['_og_description'], $result['_title']);

            return response()->json(['data' => $result]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to scan the website. Please check the URL and try again.'], 422);
        }
    }

    public function complete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'website_url'     => 'nullable|string|max:500',
            'company_name'    => 'nullable|string|max:255',
            'description'     => 'nullable|string|max:1000',
            'logo_url'        => 'nullable|url|max:1000',
            'favicon_url'     => 'nullable|url|max:1000',
            'primary_color'   => 'nullable|string|max:10',
            'secondary_color' => 'nullable|string|max:10',
            'accent_color'    => 'nullable|string|max:10',
            'font_family'     => 'nullable|string|max:100',
        ]);

        $user = Auth::user();

        Theme::updateOrCreate(
            ['user_id' => $user->id],
            array_merge($validated, ['is_active' => true])
        );

        $user->update(['onboarding_completed' => true]);

        return response()->json(['redirect' => route('dashboard')]);
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'logo' => 'required|file|image|max:4096|mimes:jpeg,png,webp,svg,gif',
        ]);

        $file      = $request->file('logo');
        $extension = $file->getClientOriginalExtension();
        $path      = 'logos/' . Auth::id() . '/' . Str::uuid() . '.' . $extension;

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
        return response()->json([
            'data' => [
                'needs_onboarding' => ! $request->user()->onboarding_completed,
            ],
        ]);
    }
}
