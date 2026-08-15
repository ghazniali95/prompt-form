<?php

namespace App\Exceptions;

use Exception;

/**
 * Thrown when a Shopify access token could not be refreshed *and* the token
 * already on the integration has expired, so any request made with it is
 * certain to fail.
 *
 * Refresh failures where the current token is still inside its validity window
 * do not throw — the caller is handed the existing token and carries on. This
 * exception exists so the doomed case surfaces as one clear failure that a
 * queued job can retry, rather than a stale token being handed back and the
 * request failing a second time further down.
 */
class ShopifyTokenRefreshException extends Exception
{
}
