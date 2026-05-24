<?php

namespace App\Http\Middleware;

use App\Models\AiGeneration;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    public function share(Request $request): array
    {
        $shared = parent::share($request);

        $user = $request->user('web-users');
        if (! $user) {
            return $shared;
        }

        $user->loadMissing('activeSubscription.plan');

        $aiUsed = AiGeneration::where('user_id', $user->id)
            ->whereMonth('created_at', now()->month)
            ->count();

        return array_merge($shared, [
            'user' => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'plan'       => $user->activeSubscription?->plan?->name ?? 'Free',
                'ai_used'    => $aiUsed,
                'ai_limit'   => $user->activeSubscription?->plan?->ai_limit ?? 10,
                'created_at' => $user->created_at?->format('M j, Y'),
            ],
        ]);
    }
}
