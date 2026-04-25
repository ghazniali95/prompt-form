<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'admin.auth' => \App\Http\Middleware\AdminAuth::class,
        ]);

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
