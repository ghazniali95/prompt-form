<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\AiGeneration;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('auth:web-users'),
        ];
    }

    public function index()
    {
        $user = Auth::guard('web-users')->user();

        $subscription = $user->subscriptions()->latest()->first();
        $aiUsed       = AiGeneration::where('user_id', $user->id)
            ->whereMonth('created_at', now()->month)
            ->count();

        return Inertia::render('Dashboard', [
            'user' => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'login_type' => $user->login_type,
                'plan'       => $subscription?->plan?->name ?? 'Free',
                'ai_used'    => $aiUsed,
                'ai_limit'   => $subscription?->plan?->ai_limit ?? 10,
            ],
        ])->rootView('web');
    }
}
