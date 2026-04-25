<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Form;
use App\Models\FormResponse;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function index()
    {
        return view('admin');
    }

    public function stats(): JsonResponse
    {
        return response()->json([
            'total_merchants'   => User::count(),
            'total_forms'       => Form::count(),
            'published_forms'   => Form::where('is_published', true)->count(),
            'total_responses'   => FormResponse::count(),
        ]);
    }

    public function merchants(Request $request): JsonResponse
    {
        $query = User::withCount(['forms', 'formResponses'])
            ->with(['forms' => fn ($q) => $q->select('id', 'shop_id', 'ulid', 'title', 'is_published', 'created_at')])
            ->orderBy('created_at', 'desc');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $merchants = $query->paginate(20);

        return response()->json($merchants);
    }

    public function merchantDetail(int $id): JsonResponse
    {
        $merchant = User::withCount(['forms', 'formResponses'])
            ->findOrFail($id);

        $forms = Form::where('shop_id', $id)
            ->withCount('responses')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($form) => [
                'id'           => $form->id,
                'ulid'         => $form->ulid,
                'title'        => $form->title,
                'is_published' => $form->is_published,
                'responses_count' => $form->responses_count,
                'schema'       => $form->schema,
                'settings'     => $form->settings,
                'styles'       => $form->styles,
                'created_at'   => $form->created_at,
                'updated_at'   => $form->updated_at,
            ]);

        return response()->json([
            'merchant' => [
                'id'                  => $merchant->id,
                'name'                => $merchant->name,
                'email'               => $merchant->email,
                'plan'                => $merchant->plan,
                'subscription_status' => $merchant->subscription_status,
                'forms_count'         => $merchant->forms_count,
                'form_responses_count' => $merchant->form_responses_count,
                'created_at'          => $merchant->created_at,
            ],
            'forms' => $forms,
        ]);
    }
}
