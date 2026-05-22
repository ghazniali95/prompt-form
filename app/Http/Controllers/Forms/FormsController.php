<?php

namespace App\Http\Controllers\Forms;

use App\Http\Controllers\Controller;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class FormsController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [new Middleware('auth:web-users')];
    }

    public function index()
    {
        $user = Auth::guard('web-users')->user();

        $forms = $user->forms()
            ->withCount('responses as submissions')
            ->latest()
            ->get()
            ->map(fn ($f) => [
                'id'          => $f->id,
                'ulid'        => $f->ulid,
                'title'       => $f->title,
                'status'      => $f->is_published ? 'published' : 'draft',
                'submissions' => $f->submissions,
                'views'       => $f->views,
                'updated_at'  => $f->updated_at->format('Y-m-d'),
            ]);

        $stats = [
            'total'       => $forms->count(),
            'published'   => $forms->where('status', 'published')->count(),
            'drafts'      => $forms->where('status', 'draft')->count(),
            'submissions' => $forms->sum('submissions'),
        ];

        return Inertia::render('Forms/Index', [
            'user'  => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
            ],
            'forms' => $forms,
            'stats' => $stats,
        ])->rootView('web');
    }
}
