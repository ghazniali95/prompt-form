<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PricingController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [new Middleware('auth:web-users')];
    }

    public function index()
    {
        $user         = Auth::guard('web-users')->user();
        $subscription = $user->activeSubscription;

        return Inertia::render('Web/Pricing', [
            'subscription' => [
                'plan_slug'   => $subscription?->plan_slug ?? 'free',
                'provider'    => $subscription?->provider,
                'pm_type'     => $user->pm_type,
                'pm_last_four'=> $user->pm_last_four,
            ],
        ])->rootView('web');
    }
}
