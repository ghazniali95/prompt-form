<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $username = (string) config('admin.username');
        $password = (string) config('admin.password');

        // Unconfigured credentials must never grant access.
        $configured = $username !== '' && $password !== '';

        $matches = $configured
            && hash_equals($username, (string) $request->getUser())
            && hash_equals($password, (string) $request->getPassword());

        if (! $matches) {
            return response('Unauthorized', 401, [
                'WWW-Authenticate' => 'Basic realm="Admin Panel"',
            ]);
        }

        return $next($request);
    }
}
