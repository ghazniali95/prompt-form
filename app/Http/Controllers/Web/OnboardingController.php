<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OnboardingController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [new Middleware('auth:web-users')];
    }

    public function index()
    {
        $user = Auth::guard('web-users')->user();

        if ($user->onboarding_completed) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Web/Onboarding', [
            'user' => [
                'id'   => $user->id,
                'name' => $user->name,
            ],
        ])->rootView('web');
    }
}
