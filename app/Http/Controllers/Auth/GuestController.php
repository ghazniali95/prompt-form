<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;

class GuestController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('guest:web-users', only: ['login', 'register']),
        ];
    }

    public function login()
    {
        return Inertia::render('Auth/Login')->rootView('web');
    }

    public function register()
    {
        return Inertia::render('Auth/Register')->rootView('web');
    }
}
