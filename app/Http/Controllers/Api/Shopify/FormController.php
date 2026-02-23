<?php

namespace App\Http\Controllers\Api\Shopify;

use App\Http\Controllers\Controller;
use App\Models\Form;
use App\Models\FormVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FormController extends Controller
{
    public function index(): JsonResponse
    {
        $forms = Auth::user()->forms()->latest()->get();

        return response()->json(['data' => $forms]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'    => 'required|string|max:255',
            'schema'   => 'nullable|array',
            'styles'   => 'nullable|array',
            'steps'    => 'nullable|array',
            'settings' => 'nullable|array',
        ]);

        $form = Auth::user()->forms()->create($validated);

        return response()->json(['data' => $form], 201);
    }

    public function show(string $id): JsonResponse
    {
        $form = Auth::user()->forms()->findOrFail($id);

        return response()->json(['data' => $form]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $form = Auth::user()->forms()->findOrFail($id);

        $validated = $request->validate([
            'title'    => 'sometimes|string|max:255',
            'schema'   => 'nullable|array',
            'styles'   => 'nullable|array',
            'steps'    => 'nullable|array',
            'settings' => 'nullable|array',
        ]);

        $form->update($validated);

        return response()->json(['data' => $form]);
    }

    public function destroy(string $id): JsonResponse
    {
        Auth::user()->forms()->findOrFail($id)->delete();

        return response()->json(null, 204);
    }

    public function publish(string $id): JsonResponse
    {
        $form = Auth::user()->forms()->findOrFail($id);

        // Save a version snapshot before publishing
        FormVersion::create([
            'form_id' => $form->id,
            'schema'  => $form->schema,
            'styles'  => $form->styles,
            'steps'   => $form->steps,
        ]);

        $form->update(['is_published' => true]);

        return response()->json(['data' => $form]);
    }
}
