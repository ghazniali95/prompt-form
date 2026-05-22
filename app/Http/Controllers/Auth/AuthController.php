<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('auth:web-users',  only: ['logout']),
            new Middleware('guest:web-users', only: ['login', 'register']),
        ];
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::guard('web-users')->attempt($credentials, $request->boolean('remember'))) {
            return response()->json([
                'message' => 'These credentials do not match our records.',
            ], 401);
        }

        $request->session()->regenerate();

        return response()->json([
            'redirect' => route('dashboard'),
        ]);
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::create([
            'name'       => $data['name'],
            'email'      => $data['email'],
            'password'   => Hash::make($data['password']),
            'login_type' => 'manual',
        ]);

        Auth::guard('web-users')->login($user);
        $request->session()->regenerate();

        return response()->json([
            'redirect' => route('dashboard'),
        ]);
    }

    public function logout(Request $request)
    {
        Auth::guard('web-users')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'redirect' => route('login'),
        ]);
    }
}
