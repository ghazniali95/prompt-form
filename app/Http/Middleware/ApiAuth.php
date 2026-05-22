<?php

namespace App\Http\Middleware;

use App\Models\Integration;
use App\Models\User;
use App\Services\Shopify\JwtService;
use App\Services\Shopify\TokenExchangeService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ApiAuth
{
    public function __construct(
        private JwtService $jwt,
        private TokenExchangeService $tokenExchange,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        Auth::shouldUse('web-users');

        // Strategy 1: Shopify session token (embedded app)
        if ($user = $this->resolveShopifyUser($request)) {
            Auth::guard('web-users')->setUser($user);
            return $next($request);
        }

        // Strategy 2: Web session (Inertia SPA)
        if (Auth::guard('web-users')->check()) {
            return $next($request);
        }

        // Strategy 3: API key (WordPress plugin / external integrations)
        if ($user = $this->resolveApiKey($request)) {
            Auth::guard('web-users')->setUser($user);
            return $next($request);
        }

        return response()->json(['error' => 'Unauthenticated.'], 401);
    }

    private function resolveShopifyUser(Request $request): ?User
    {
        $raw = $request->bearerToken();
        if (! $raw) {
            return null;
        }

        $claims = $this->jwt->decode($raw);
        if (! $claims) {
            return null;
        }

        $shopDomain = $this->jwt->shopDomain($claims);
        if (! $shopDomain) {
            return null;
        }

        // Happy path: Integration already exists
        $user = Integration::where('name', $shopDomain)->first()?->user;
        if ($user) {
            return $user;
        }

        // Integration missing — silently obtain an offline access token via Token Exchange
        // so the merchant never gets bounced out of the embedded app for re-auth.
        return $this->tokenExchange->exchangeAndResolveUser($shopDomain, $raw);
    }

    private function resolveApiKey(Request $request): ?User
    {
        $key = $request->header('X-Api-Key');
        if (! $key) {
            return null;
        }

        return User::where('api_key', $key)->first();
    }
}
