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

class DashboardController extends Controller implements HasMiddleware
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
            'total_merchants'     => User::count(),
            'connected_merchants' => User::whereHas('integrations', fn ($q) => $q->where('status', true))->count(),
            'paying_merchants'    => User::whereHas('subscriptions', fn ($q) => $q->where('status', 'active')
                ->where('plan_slug', '!=', 'free'))->count(),
            'total_forms'         => Form::count(),
            'published_forms'     => Form::where('is_published', true)->count(),
            'total_responses'     => FormResponse::count(),
        ]);
    }

    public function merchants(Request $request): JsonResponse
    {
        $query = User::query()
            ->withCount(['forms', 'formResponses'])
            ->with([
                'activeSubscription:id,user_id,plan_slug,status,trial_ends_at',
                'integrations:id,user_id,name,type,status,url',
            ])
            ->orderByDesc('created_at');

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $merchants = $query->paginate(20)->through(fn (User $user) => $this->merchantRow($user));

        return response()->json($merchants);
    }

    public function merchantDetail(int $id): JsonResponse
    {
        $merchant = User::withCount(['forms', 'formResponses'])
            ->with([
                'activeSubscription:id,user_id,plan_slug,status,trial_ends_at',
                'integrations:id,user_id,name,type,status,url,created_at',
                'subscriptions:id,user_id,plan_slug,provider,status,trial_ends_at,activated_on,cancelled_at,created_at',
            ])
            ->findOrFail($id);

        // Forms are soft-deleted, so include trashed ones — the admin wants the
        // full history, not just what the merchant currently sees.
        $forms = Form::withTrashed()
            ->where('user_id', $id)
            ->withCount('responses')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Form $form) => [
                'id'              => $form->id,
                'ulid'            => $form->ulid,
                'title'           => $form->title,
                'layout_type'     => $form->layout_type,
                'is_published'    => $form->is_published,
                'views'           => $form->views,
                'responses_count' => $form->responses_count,
                'has_source'      => filled($form->html_content),
                'has_compiled'    => filled($form->compiled_content),
                'deleted_at'      => $form->deleted_at,
                'created_at'      => $form->created_at,
                'updated_at'      => $form->updated_at,
            ]);

        return response()->json([
            'merchant' => $this->merchantRow($merchant) + [
                'onboarding_completed' => (bool) $merchant->onboarding_completed,
                'login_type'           => $merchant->login_type,
                'email_verified_at'    => $merchant->email_verified_at,
                'integrations'         => $merchant->integrations->map(fn ($i) => [
                    'id'         => $i->id,
                    'name'       => $i->name,
                    'type'       => $i->type,
                    'url'        => $i->url,
                    'status'     => (bool) $i->status,
                    'created_at' => $i->created_at,
                ])->values(),
                'subscriptions'        => $merchant->subscriptions
                    ->sortByDesc('created_at')
                    ->map(fn ($s) => [
                        'id'            => $s->id,
                        'plan_slug'     => $s->plan_slug,
                        'provider'      => $s->provider,
                        'status'        => $s->status,
                        'trial_ends_at' => $s->trial_ends_at,
                        'activated_on'  => $s->activated_on,
                        'cancelled_at'  => $s->cancelled_at,
                        'created_at'    => $s->created_at,
                    ])->values(),
            ],
            'forms' => $forms,
        ]);
    }

    /**
     * Form source is potentially large, so it is fetched on demand rather than
     * inlined into the merchant detail payload.
     */
    public function formSource(string $ulid): JsonResponse
    {
        $form = Form::withTrashed()->where('ulid', $ulid)->firstOrFail();

        return response()->json([
            'ulid'             => $form->ulid,
            'title'            => $form->title,
            'layout_type'      => $form->layout_type,
            'html_content'     => $form->html_content,
            'compiled_content' => $form->compiled_content,
        ]);
    }

    /**
     * Shared shape for a merchant row, used by both the list and the detail page.
     */
    private function merchantRow(User $user): array
    {
        $store = $user->integrations->firstWhere('status', true)
            ?? $user->integrations->first();

        return [
            'id'                   => $user->id,
            'name'                 => $user->name,
            'email'                => $user->email,
            'plan'                 => $user->plan,
            'subscription_status'  => $user->activeSubscription?->status,
            'trial_ends_at'        => $user->activeSubscription?->trial_ends_at,
            'store_name'           => $store?->name,
            'store_type'           => $store?->type,
            'is_connected'         => (bool) $store?->status,
            'forms_count'          => $user->forms_count,
            'form_responses_count' => $user->form_responses_count,
            'created_at'           => $user->created_at,
        ];
    }
}
