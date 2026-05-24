<?php

namespace App\Http\Controllers\Shopify;

use App\Http\Controllers\Controller;
use App\Services\Shopify\AuthService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private AuthService $auth) {}

    /**
     * Begin OAuth — redirect merchant to Shopify's authorization screen.
     */
    public function begin(Request $request)
    {
        $shop = $request->query('shop', '');

        if (! $this->auth->isValidShop($shop)) {
            return response('Invalid shop domain.', 400);
        }

        // Shopify always sends hmac on install; reject requests that omit it entirely
        if (! $request->has('hmac') || ! $this->auth->validateHmac($request)) {
            return response('Invalid HMAC.', 401);
        }

        return redirect($this->auth->buildAuthUrl($shop));
    }

    /**
     * OAuth callback — exchange code for token, upsert Integration, redirect to app.
     */
    public function callback(Request $request)
    {
        $shop = $request->query('shop', '');

        if (! $this->auth->isValidShop($shop)) {
            return response('Invalid shop domain.', 400);
        }

        if (! $this->auth->validateHmac($request)) {
            return response('Invalid HMAC.', 401);
        }

        $storedState = \Illuminate\Support\Facades\Cache::pull("shopify_oauth_state_{$shop}");
        if (! $storedState || $request->query('state') !== $storedState) {
            return response('Invalid state.', 401);
        }

        $accessToken = $this->auth->exchangeCode($shop, $request->query('code', ''));

        if (! $accessToken) {
            return response('Failed to obtain access token.', 500);
        }

        $this->auth->upsertIntegration($shop, $accessToken);

        $host = $request->query('host', base64_encode($shop . '/admin'));

        return redirect('/shopify/app?shop=' . $shop . '&host=' . $host);
    }
}
