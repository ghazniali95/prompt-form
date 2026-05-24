<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\GuestController;
use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\Web\AnalyticsController;
use App\Http\Controllers\Web\IntegrationsController;
use App\Http\Controllers\Web\OnboardingController;
use App\Http\Controllers\Web\PricingController;
use App\Http\Controllers\Web\ProfileController;
use App\Http\Controllers\Web\SupportController;
use App\Http\Controllers\Web\TemplatesController;
use App\Http\Controllers\Forms\FormsController;
use App\Http\Controllers\Submissions\SubmissionsController;
use App\Http\Controllers\Home\HomeController;
use App\Http\Controllers\Billing\StripeCallbackController;
use App\Http\Controllers\Billing\StripeWebhookController;
use App\Http\Controllers\Shopify\AuthController as ShopifyAuthController;
use App\Http\Controllers\Shopify\BillingCallbackController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public / Marketing
|--------------------------------------------------------------------------
*/
// Embed script — served with CORS + long-term cache headers
Route::get('/embed.js', function () {
    $path = public_path('embed.js');
    if (! file_exists($path)) {
        abort(404);
    }
    return response()->file($path, [
        'Content-Type'  => 'application/javascript',
        'Cache-Control' => 'public, max-age=86400',
        'Access-Control-Allow-Origin' => '*',
    ]);
});

Route::get('/',               [HomeController::class, 'index'])->name('welcome');
Route::get('/privacy-policy', [HomeController::class, 'privacy'])->name('privacy');
Route::get('/terms',          [HomeController::class, 'terms'])->name('terms');

/*
|--------------------------------------------------------------------------
| Web Auth — login / register pages and JSON endpoints (Inertia SPA)
|--------------------------------------------------------------------------
*/
Route::get('/login',    [GuestController::class, 'login'])->name('login');
Route::get('/register', [GuestController::class, 'register'])->name('register');

Route::post('/auth/login',    [AuthController::class, 'login'])->name('auth.login');
Route::post('/auth/register', [AuthController::class, 'register'])->name('auth.register');
Route::post('/auth/logout',   [AuthController::class, 'logout'])->name('auth.logout');

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/
Route::get('/onboarding', [OnboardingController::class, 'index'])->name('onboarding');

Route::get('/dashboard',                [DashboardController::class,  'index'])->name('dashboard');
Route::get('/forms',                    [FormsController::class,      'index'])->name('forms.index');
Route::get('/submissions',              [SubmissionsController::class,'index'])->name('submissions.index');
Route::get('/templates',    [TemplatesController::class,   'index'])->name('web.templates');
Route::get('/analytics',    [AnalyticsController::class,   'index'])->name('web.analytics');
Route::get('/integrations', [IntegrationsController::class, 'index'])->name('web.integrations');
Route::get('/pricing',      [PricingController::class,      'index'])->name('web.pricing');
Route::get('/support',      [SupportController::class,      'index'])->name('web.support');
Route::get('/web/profile',  [ProfileController::class,      'index'])->name('web.profile');

Route::get('/logs', '\Rap2hpoutre\LaravelLogViewer\LogViewerController@index');

/*
|--------------------------------------------------------------------------
| Shopify OAuth + Billing
|--------------------------------------------------------------------------
*/
Route::get('/auth/shopify/begin',    [ShopifyAuthController::class, 'begin'])->name('shopify.auth.begin');
Route::get('/auth/shopify/callback', [ShopifyAuthController::class, 'callback'])->name('shopify.auth.callback');

// Shopify billing callback — no App Bridge session, top-level redirect
Route::get('/auth/shopify/billing/callback', BillingCallbackController::class)->name('billing.callback');

/*
|--------------------------------------------------------------------------
| Stripe Billing Callbacks
|--------------------------------------------------------------------------
*/
Route::get('/billing/stripe/success', [StripeCallbackController::class, 'success'])->name('billing.stripe.success');
Route::get('/billing/stripe/cancel',  [StripeCallbackController::class, 'cancel'])->name('billing.stripe.cancel');

// Stripe webhooks — no CSRF, no auth
Route::post('/stripe/webhook', [StripeWebhookController::class, 'handle'])
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class])
    ->name('stripe.webhook');
