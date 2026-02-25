<?php

use App\Http\Controllers\BillingCallbackController;
use Illuminate\Support\Facades\Route;

// Home route — serves our React + Polaris app.
// SHOPIFY_MANUAL_ROUTES=home disables the package's default home route
// so we can register our own here.
Route::middleware(['verify.shopify'])->group(function () {
    Route::get('/', fn() => view('shopify'))->name('home');
    Route::get('/pricing', fn() => view('shopify'));
    Route::get('/billing/callback', BillingCallbackController::class)->name('billing.callback');
});
