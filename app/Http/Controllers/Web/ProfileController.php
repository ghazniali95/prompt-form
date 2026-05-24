<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;

class ProfileController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [new Middleware('auth:web-users')];
    }

    public function index()
    {
        return Inertia::render('Web/Profile')->rootView('web');
    }
}
