<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\RecaptchaService;
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

    public function login(Request $request, RecaptchaService $recaptcha)
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! $recaptcha->verify($request->input('recaptcha_token'), 'login')) {
            return response()->json([
                'message' => 'Captcha verification failed. Please try again.',
            ], 422);
        }

        if (!Auth::guard('web-users')->attempt($credentials, $request->boolean('remember'))) {
            return response()->json([
                'message' => 'These credentials do not match our records.',
            ], 401);
        }

        $request->session()->regenerate();

        $user     = Auth::guard('web-users')->user();
        $redirect = $user->onboarding_completed ? route('dashboard') : route('onboarding');

        return response()->json(['redirect' => $redirect]);
    }

    public function register(Request $request, RecaptchaService $recaptcha)
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        if (! $recaptcha->verify($request->input('recaptcha_token'), 'register')) {
            return response()->json([
                'message' => 'Captcha verification failed. Please try again.',
            ], 422);
        }

        $user = User::create([
            'name'       => $data['name'],
            'email'      => $data['email'],
            'password'   => Hash::make($data['password']),
            'login_type' => 'manual',
        ]);

        Auth::guard('web-users')->login($user);
        $request->session()->regenerate();

        return response()->json(['redirect' => route('onboarding')]);
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
