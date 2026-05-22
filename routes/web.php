<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\GuestController;
use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\Forms\FormsController;
use App\Http\Controllers\Home\HomeController;
use App\Http\Controllers\Shopify\AuthController as ShopifyAuthController;
use App\Http\Controllers\Shopify\BillingCallbackController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public / Marketing
|--------------------------------------------------------------------------
*/
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
Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
Route::get('/forms',     [FormsController::class, 'index'])->name('forms.index');

Route::get('/logs', '\Rap2hpoutre\LaravelLogViewer\LogViewerController@index');

/*
|--------------------------------------------------------------------------
| Shopify OAuth + Billing
|--------------------------------------------------------------------------
*/
Route::get('/auth/shopify/begin',    [ShopifyAuthController::class, 'begin'])->name('shopify.auth.begin');
Route::get('/auth/shopify/callback', [ShopifyAuthController::class, 'callback'])->name('shopify.auth.callback');

// Billing callback — outside verify.shopify; Shopify does a top-level redirect here
// after merchant approves/declines. No App Bridge session at this point.
Route::get('/auth/shopify/billing/callback', BillingCallbackController::class)->name('billing.callback');
