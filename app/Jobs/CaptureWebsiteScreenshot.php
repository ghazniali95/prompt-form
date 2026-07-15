<?php

namespace App\Jobs;

use App\Models\Theme;
use App\Services\WebsiteScreenshotService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class CaptureWebsiteScreenshot implements ShouldQueue
{
    use Queueable;

    /** The number of times the job may be attempted. */
    public int $tries = 2;

    /** The number of seconds the job can run before timing out. */
    public int $timeout = 90;

    public function __construct(public Theme $theme) {}

    public function handle(WebsiteScreenshotService $screenshots): void
    {
        $url = $this->theme->website_url;

        if (! $url) {
            return;
        }

        $this->theme->update(['screenshot_status' => 'pending']);

        $screenshotUrl = $screenshots->capture($url, $this->theme->user_id);

        $this->theme->update([
            'screenshot_url' => $screenshotUrl,
            'screenshot_status' => 'done',
            'screenshot_captured_at' => now(),
        ]);
    }

    public function failed(\Throwable $e): void
    {
        Log::warning('CaptureWebsiteScreenshot: capture failed', [
            'theme_id' => $this->theme->id,
            'url' => $this->theme->website_url,
            'error' => $e->getMessage(),
        ]);

        $this->theme->update(['screenshot_status' => 'failed']);
    }
}
