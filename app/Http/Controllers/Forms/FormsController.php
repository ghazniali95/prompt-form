<?php

namespace App\Http\Controllers\Forms;

use App\Http\Controllers\Controller;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;

class FormsController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [new Middleware('auth:web-users')];
    }

    public function index()
    {
        return Inertia::render('Forms/Index')->rootView('web');
    }
}
