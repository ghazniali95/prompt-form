<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\Form;
use App\Models\FormResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicFormController extends Controller
{
    public function show(string $ulid): JsonResponse
    {
        $form = Form::where('ulid', $ulid)->where('is_published', true)->firstOrFail();

        return response()->json([
            'data' => [
                'ulid'     => $form->ulid,
                'title'    => $form->title,
                'schema'   => $form->schema,
                'styles'   => $form->styles,
                'steps'    => $form->steps,
                'settings' => $form->settings,
            ],
        ]);
    }

    public function submit(Request $request, string $ulid): JsonResponse
    {
        $form = Form::where('ulid', $ulid)->where('is_published', true)->firstOrFail();

        $validated = $request->validate([
            'data' => 'required|array',
        ]);

        FormResponse::create([
            'form_id'      => $form->id,
            'shop_id'      => $form->shop_id,
            'data'         => $validated['data'],
            'metadata'     => [
                'ip'         => hash('sha256', $request->ip()),
                'user_agent' => $request->userAgent(),
                'referrer'   => $request->header('referer'),
            ],
            'submitted_at' => now(),
        ]);

        return response()->json(['message' => 'Form submitted successfully.']);
    }
}
