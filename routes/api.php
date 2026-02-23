<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Shopify\FormController;
use App\Http\Controllers\Api\Shopify\AiGenerationController;
use App\Http\Controllers\Api\Public\PublicFormController;

/*
|--------------------------------------------------------------------------
| Shopify Admin API (session-token authenticated)
|--------------------------------------------------------------------------
*/
Route::middleware(['verify.shopify'])->prefix('shopify')->group(function () {
    // Forms
    Route::apiResource('forms', FormController::class);
    Route::post('forms/{form}/publish', [FormController::class, 'publish']);

    // AI generation
    Route::post('ai/generate', [AiGenerationController::class, 'generate']);
    Route::post('ai/refine', [AiGenerationController::class, 'refine']);
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
