<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Shopify\FormController;
use App\Http\Controllers\Api\Shopify\AiGenerationController;
use App\Http\Controllers\Api\Shopify\BillingController;
use App\Http\Controllers\Api\Shopify\StatsController;
use App\Http\Controllers\Api\Shopify\GdprController;
use App\Http\Controllers\Api\Shopify\AppUninstalledController;
use App\Http\Controllers\Api\Public\PublicFormController;

/*
|--------------------------------------------------------------------------
| Shopify Admin API (session-token authenticated)
|--------------------------------------------------------------------------
*/
Route::middleware(['verify.shopify'])->prefix('shopify')->group(function () {
    // Forms
    Route::apiResource('forms', FormController::class);
    Route::get('forms/{form}/responses', [FormController::class, 'responses']);
    Route::post('forms/{form}/publish', [FormController::class, 'publish']);
    Route::post('forms/{form}/unpublish', [FormController::class, 'unpublish']);
    Route::post('forms/{form}/duplicate', [FormController::class, 'duplicate']);

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
Route::middleware([\App\Http\Middleware\VerifyShopifyWebhook::class])->prefix('webhooks')->group(function () {
    // GDPR mandatory webhooks
    Route::post('gdpr/customers-data-request', [GdprController::class, 'customersDataRequest']);
    Route::post('gdpr/customers-redact',        [GdprController::class, 'customersRedact']);
    Route::post('gdpr/shop-redact',             [GdprController::class, 'shopRedact']);

    // App lifecycle
    Route::post('app/uninstalled', AppUninstalledController::class);
});

/*
|--------------------------------------------------------------------------
| Public Storefront API (no auth — rate limited, CORS enabled)
|--------------------------------------------------------------------------
*/
Route::middleware([\App\Http\Middleware\PublicApiCors::class])->prefix('public')->group(function () {
    // Handle CORS preflight without rate limiting
    Route::options('{any}', fn() => response('', 200))->where('any', '.*');

    Route::middleware(['throttle:60,1'])->group(function () {
        Route::get('forms/{ulid}', [PublicFormController::class, 'show']);
        Route::post('forms/{ulid}/submit', [PublicFormController::class, 'submit']);
    });
});
