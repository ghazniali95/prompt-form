<?php

namespace App\Http\Controllers\Shopify;

use App\Http\Controllers\Api\V1\Shopify\AppUninstalledController;
use App\Http\Controllers\Api\V1\Shopify\GdprController;
use App\Http\Controllers\Controller;
use App\Http\Middleware\Shopify\VerifyWebhook;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class WebhookController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [new Middleware(VerifyWebhook::class)];
    }

    public function __invoke(Request $request): JsonResponse
    {
        $topic = $request->header('X-Shopify-Topic');

        return match ($topic) {
            'customers/data_request' => app(GdprController::class)->customersDataRequest($request),
            'customers/redact'       => app(GdprController::class)->customersRedact($request),
            'shop/redact'            => app(GdprController::class)->shopRedact($request),
            'app/uninstalled'        => app(AppUninstalledController::class)($request),
            default                  => response()->json([], 200),
        };
    }
}
