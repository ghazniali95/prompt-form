<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('web')->group(base_path('routes/shopify.php'));
            Route::middleware('web')->group(base_path('routes/admin.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'admin.auth'    => \App\Http\Middleware\AdminAuth::class,
            'api.auth'      => \App\Http\Middleware\ApiAuth::class,
            'verify.shopify' => \App\Http\Middleware\Shopify\VerifyShopify::class,
        ]);

        // Allow web session cookies to be read on API routes (needed for web-users strategy in ApiAuth).
        // EncryptCookies must come first so the encrypted laravel_session cookie is decrypted
        // before StartSession tries to read the session ID from it.
        $middleware->prependToGroup('api', [
            \Illuminate\Cookie\Middleware\EncryptCookies::class,
            \Illuminate\Session\Middleware\StartSession::class,
        ]);

        // Share authenticated user data (plan, AI usage) with all Inertia responses
        $middleware->web(\App\Http\Middleware\HandleInertiaRequests::class);

        // Trust all proxies — required for ngrok tunnel
        $middleware->trustProxies(at: '*');

        // Bypass ngrok browser interstitial
        $middleware->append(\App\Http\Middleware\HandleNgrok::class);

        // Exclude Shopify webhook and public API routes from CSRF verification
        $middleware->validateCsrfTokens(except: [
            'webhook/*',
            'api/public/*',
            'api/shopify/*',
            'api/admin/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
