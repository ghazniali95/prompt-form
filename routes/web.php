<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\BillingCallbackController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public landing page — shown to anyone visiting the root URL directly
Route::get('/', fn () => Inertia::render('Landing')->rootView('inertia'))->name('landing');

// Log viewer — public access
Route::get('/logs', '\Rap2hpoutre\LaravelLogViewer\LogViewerController@index');

// Public legal pages — no auth required
Route::get('/privacy-policy', fn () => view('privacy-policy'))->name('privacy');
Route::get('/terms', fn () => view('terms'))->name('terms');

// Shopify embedded app — SHOPIFY_MANUAL_ROUTES=home means we register the `home` route manually.
Route::middleware(['verify.shopify'])->group(function () {
    Route::get('/shopify/app', fn() => view('shopify'))->name('home');
    Route::get('/shopify/pricing', fn() => view('shopify'));
});

// Billing callback — intentionally outside verify.shopify.
// After the merchant approves/declines on Shopify's billing page, Shopify
// does a top-level browser redirect here. There is no App Bridge session at
// this point so verify.shopify would loop trying to re-authenticate.
// We resolve the user from the `shop` query param Shopify sends.
Route::get('/billing/callback', BillingCallbackController::class)->name('billing.callback');

// Admin panel — HTTP Basic Auth protected
Route::middleware(['admin.auth'])->prefix('admin')->group(function () {
    Route::get('/{any?}', [AdminDashboardController::class, 'index'])->where('any', '.*');
});
