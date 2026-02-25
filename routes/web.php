<?php

use App\Http\Controllers\BillingCallbackController;
use Illuminate\Support\Facades\Route;

// Public legal pages — no auth required
Route::get('/privacy-policy', fn () => view('privacy-policy'))->name('privacy');
Route::get('/terms', fn () => view('terms'))->name('terms');

// Home route — serves our React + Polaris app.
// SHOPIFY_MANUAL_ROUTES=home disables the package's default home route
// so we can register our own here.
Route::middleware(['verify.shopify'])->group(function () {
    Route::get('/', fn() => view('shopify'))->name('home');
    Route::get('/pricing', fn() => view('shopify'));
});

// Billing callback — intentionally outside verify.shopify.
// After the merchant approves/declines on Shopify's billing page, Shopify
// does a top-level browser redirect here. There is no App Bridge session at
// this point so verify.shopify would loop trying to re-authenticate.
// We resolve the user from the `shop` query param Shopify sends.
Route::get('/billing/callback', BillingCallbackController::class)->name('billing.callback');
