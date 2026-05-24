<?php

namespace App\Http\Middleware\Shopify;

use App\Services\Shopify\JwtService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyShopify
{
    public function __construct(private JwtService $jwt) {}

    public function handle(Request $request, Closure $next): Response
    {
        // Embedded app: App Bridge sends session token as Bearer on API calls
        if ($token = $request->bearerToken()) {
            if ($this->jwt->decode($token)) {
                return $next($request);
            }
        }

        // Initial page load from Shopify Admin: shop + host params are present,
        // App Bridge will handle getting a session token client-side
        $shop = $request->query('shop', '');
        if ($shop && preg_match('/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/', $shop)) {
            return $next($request);
        }

        // No valid auth — send to OAuth begin
        if ($shop) {
            return redirect()->route('shopify.auth.begin', ['shop' => $shop]);
        }

        return response('Unauthorized.', 401);
    }
}
