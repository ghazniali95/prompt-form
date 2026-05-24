<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class IntegrationsController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [new Middleware('auth:web-users')];
    }

    public function index()
    {
        $user     = Auth::guard('web-users')->user();
        $shopify  = Integration::where('user_id', $user->id)
            ->where('type', 'shopify')
            ->first();

        return Inertia::render('Web/Integrations', [
            'shopify_integration' => $shopify ? [
                'id'          => $shopify->id,
                'shop_domain' => $shopify->name,
                'status'      => $shopify->status,
                'connected_at'=> $shopify->created_at?->toDateString(),
            ] : null,
        ])->rootView('web');
    }
}
