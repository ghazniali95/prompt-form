<?php

namespace App\Http\Controllers\API\V1\Submissions;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\SubmissionResource;
use App\Models\FormResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SubmissionsController extends Controller
{
    /**
     * List submissions across all of the authenticated user's forms.
     *
     * Query params:
     *   form_id   — filter to a single form (numeric ID or ULID)
     *   search    — full-text search inside JSON data
     *   from      — submitted_at >= (ISO date string)
     *   to        — submitted_at <= (ISO date string)
     *   per_page  — default 25, max 100
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();

        $query = FormResponse::whereHas('form', fn ($q) => $q->where('user_id', $user->id))
            ->with('form:id,ulid,title')
            ->orderByDesc('submitted_at');

        if ($rawFormId = $request->input('form_id')) {
            $formQuery = $user->forms();
            $form = is_numeric($rawFormId)
                ? $formQuery->findOrFail($rawFormId)
                : $formQuery->where('ulid', $rawFormId)->firstOrFail();
            $query->where('form_id', $form->id);
        }

        if ($search = $request->string('search')->trim()->value()) {
            $query->whereRaw('CAST(`data` AS CHAR) LIKE ?', ["%{$search}%"]);
        }

        if ($from = $request->input('from')) {
            $query->where('submitted_at', '>=', $from);
        }

        if ($to = $request->input('to')) {
            $query->where('submitted_at', '<=', $to . ' 23:59:59');
        }

        $perPage     = min((int) $request->input('per_page', 25), 100);
        $submissions = $query->paginate($perPage);

        return SubmissionResource::collection($submissions)->response();
    }

    public function show(string $id): JsonResponse
    {
        $submission = FormResponse::whereHas('form', fn ($q) => $q->where('user_id', Auth::id()))
            ->with('form:id,ulid,title')
            ->findOrFail($id);

        return (new SubmissionResource($submission))->response();
    }

    public function destroy(string $id): JsonResponse
    {
        FormResponse::whereHas('form', fn ($q) => $q->where('user_id', Auth::id()))
            ->findOrFail($id)
            ->delete();

        return response()->json(null, 204);
    }
}
