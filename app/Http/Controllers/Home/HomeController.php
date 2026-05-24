<?php

namespace App\Http\Controllers\Home;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        return redirect()->route('login');
    }

    public function privacy()
    {
        return Inertia::render('Home/Privacy')->rootView('web');
    }

    public function terms()
    {
        return Inertia::render('Home/Terms')->rootView('web');
    }
}
