<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleNgrok
{
    /**
     * Bypass ngrok's browser warning interstitial page by setting
     * the ngrok-skip-browser-warning header on all responses.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $response->headers->set('ngrok-skip-browser-warning', 'true');
        return $response;
    }
}
