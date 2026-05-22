<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Forms\FormChatController;
use App\Http\Controllers\Api\V1\Forms\FormController;
use App\Http\Controllers\Api\V1\AI\AiGenerationController;
use App\Http\Controllers\Api\V1\Analytics\StatsController;
use App\Http\Controllers\Api\V1\Shopify\BillingController;
use App\Http\Controllers\Shopify\WebhookController;
use App\Http\Controllers\Api\V1\Public\PublicFormController;

/*
|--------------------------------------------------------------------------
| Authenticated API — unified auth (Shopify JWT / web session / API key)
|--------------------------------------------------------------------------
*/
Route::middleware(['api.auth'])->prefix('v1')->group(function () {
    // Forms
    Route::apiResource('forms', FormController::class);
    Route::get('forms/{form}/responses', [FormController::class, 'responses']);
    Route::post('forms/{form}/publish', [FormController::class, 'publish']);
    Route::post('forms/{form}/unpublish', [FormController::class, 'unpublish']);
    Route::post('forms/{form}/duplicate', [FormController::class, 'duplicate']);

    // AI chat per form
    Route::get('forms/{form}/conversation', [FormChatController::class, 'messages']);
    Route::post('forms/{form}/chat', [FormChatController::class, 'chat']);

    // Stats
    Route::get('stats', [StatsController::class, 'index']);

    // AI generation
    Route::post('ai/generate', [AiGenerationController::class, 'generate']);
    Route::post('ai/refine', [AiGenerationController::class, 'refine']);

    // Billing
    Route::get('billing/current', [BillingController::class, 'current']);
    Route::post('billing/subscribe', [BillingController::class, 'subscribe']);
    Route::post('billing/cancel', [BillingController::class, 'cancel']);
});

/*
|--------------------------------------------------------------------------
| Shopify Webhooks (HMAC-verified, no session auth)
|--------------------------------------------------------------------------
*/
Route::post('shopify/webhooks', WebhookController::class);

/*
|--------------------------------------------------------------------------
| Public Storefront API — Shopify Theme App Extension Widget
|--------------------------------------------------------------------------
| These routes are called by the PromptForm widget running inside a
| merchant's Shopify storefront (extensions/form-block/blocks/form.liquid).
| Because the widget is served from the merchant's shop domain and calls
| back to this app's domain, every response needs CORS headers — that is
| handled by PublicApiCors middleware.
|
| OPTIONS preflight is answered immediately (before the rate limiter) so
| browsers can confirm cross-origin permissions without consuming quota.
|
| GET  /api/public/forms/{ulid}        — fetch form schema to render widget
| POST /api/public/forms/{ulid}/submit — store a visitor's form submission
|
| Rate limit: 60 requests / minute per IP (no auth on these endpoints).
|--------------------------------------------------------------------------
*/
Route::middleware([\App\Http\Middleware\PublicApiCors::class])->prefix('public')->group(function () {
    Route::options('{any}', fn() => response('', 200))->where('any', '.*');

    Route::middleware(['throttle:60,1'])->group(function () {
        Route::get('forms/{ulid}', [PublicFormController::class, 'show']);
        Route::post('forms/{ulid}/submit', [PublicFormController::class, 'submit']);
    });
});
