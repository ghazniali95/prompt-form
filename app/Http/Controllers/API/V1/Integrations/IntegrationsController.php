<?php

namespace App\Http\Controllers\API\V1\Integrations;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class IntegrationsController extends Controller
{
    public function disconnectShopify(): JsonResponse
    {
        $integration = Integration::where('user_id', Auth::id())
            ->where('type', 'shopify')
            ->first();

        if (! $integration) {
            return response()->json(['error' => 'No Shopify integration found.'], 404);
        }

        $integration->update(['token' => null, 'status' => false]);

        return response()->json(['message' => 'Shopify integration disconnected.']);
    }
}
