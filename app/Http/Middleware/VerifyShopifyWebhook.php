<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyShopifyWebhook
{
    public function handle(Request $request, Closure $next): Response
    {
        $hmac = $request->header('X-Shopify-Hmac-Sha256');

        if (! $hmac) {
            return response()->json(['error' => 'Missing HMAC header.'], 401);
        }

        $secret   = config('shopify-app.api_secret');
        $payload  = $request->getContent();
        $computed = base64_encode(hash_hmac('sha256', $payload, $secret, true));

        if (! hash_equals($computed, $hmac)) {
            return response()->json(['error' => 'Invalid webhook signature.'], 401);
        }

        return $next($request);
    }
}
