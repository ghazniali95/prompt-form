<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Form;
use App\Models\FormResponse;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;

class AdminDashboardController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('admin.auth'),
        ];
    }

    public function index()
    {
        return Inertia::render('Admin/Dashboard')->rootView('web');
    }

    public function merchantPage(int $id)
    {
        return Inertia::render('Admin/MerchantAccount', ['merchantId' => $id])->rootView('web');
    }

    public function stats(): JsonResponse
    {
        return response()->json([
            'total_merchants'   => User::withTrashed()->count(),
            'active_merchants'  => User::count(),
            'total_forms'       => Form::count(),
            'published_forms'   => Form::where('is_published', true)->count(),
            'total_responses'   => FormResponse::count(),
        ]);
    }

    public function merchants(Request $request): JsonResponse
    {
        $query = User::withTrashed()
            ->withCount(['forms', 'formResponses'])
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
        $merchant = User::withTrashed()
            ->withCount(['forms', 'formResponses'])
            ->findOrFail($id);

        $forms = Form::where('user_id', $id)
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
