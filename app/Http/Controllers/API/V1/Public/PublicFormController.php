<?php

namespace App\Http\Controllers\API\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Form;
use App\Models\FormResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicFormController extends Controller
{
    public function show(string $ulid): JsonResponse
    {
        $form = Form::where('ulid', $ulid)->firstOrFail();

        if (! $form->is_published) {
            return response()->json(['error' => 'draft'], 403);
        }

        $compiled = $form->compiled_content;

        return response()->json([
            'data' => [
                'ulid'         => $form->ulid,
                'title'        => $form->title,
                'layout_type'  => $form->layout_type ?? 'standard',
                'component'    => $compiled ?? $form->html_content,
                'is_compiled'  => ! is_null($compiled),
            ],
        ]);
    }

    public function submit(Request $request, string $ulid): JsonResponse
    {
        $form = Form::where('ulid', $ulid)->firstOrFail();

        $validated = $request->validate([
            'data' => 'required|array',
        ]);

        FormResponse::create([
            'form_id'      => $form->id,
            'user_id'      => $form->user_id,
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
