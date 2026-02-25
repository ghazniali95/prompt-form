<?php

namespace App\Http\Controllers\Api\Shopify;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GdprController extends Controller
{
    /**
     * customers/data_request
     *
     * Shopify asks us to provide any data stored for a specific customer.
     * We store form responses keyed by shop only — no Shopify customer IDs
     * are linked to individual submissions. Metadata contains only hashed IPs.
     * We acknowledge receipt and log for compliance records.
     */
    public function customersDataRequest(Request $request): JsonResponse
    {
        $payload = $request->json()->all();

        Log::info('GDPR: customers/data_request received', [
            'shop'        => $payload['shop_domain'] ?? null,
            'customer_id' => $payload['customer']['id'] ?? null,
            'email'       => $payload['customer']['email'] ?? null,
        ]);

        return response()->json([], 200);
    }

    /**
     * customers/redact
     *
     * Shopify requests deletion of a specific customer's data.
     * We don't store Shopify customer IDs on form responses, so we cannot
     * directly identify submissions by customer. We log for compliance records.
     */
    public function customersRedact(Request $request): JsonResponse
    {
        $payload = $request->json()->all();

        Log::info('GDPR: customers/redact received', [
            'shop'        => $payload['shop_domain'] ?? null,
            'customer_id' => $payload['customer']['id'] ?? null,
        ]);

        return response()->json([], 200);
    }

    /**
     * shop/redact
     *
     * Shopify requests full deletion of all shop data (fires 48 hrs after uninstall).
     * We permanently delete all forms, responses, AI generation records, and the user.
     */
    public function shopRedact(Request $request): JsonResponse
    {
        $payload    = $request->json()->all();
        $shopDomain = $payload['shop_domain'] ?? null;

        Log::info('GDPR: shop/redact received', ['shop' => $shopDomain]);

        if ($shopDomain) {
            $user = User::where('name', $shopDomain)->first();

            if ($user) {
                // Delete in dependency order to avoid FK constraint issues.
                // form_responses also cascade-deletes via the forms FK,
                // but we delete explicitly to be safe.
                $user->formResponses()->delete();
                $user->aiGenerations()->delete();
                $user->forms()->each(fn ($form) => $form->delete());
                $user->delete();

                Log::info('GDPR: shop/redact — all data deleted', ['shop' => $shopDomain]);
            }
        }

        return response()->json([], 200);
    }
}
