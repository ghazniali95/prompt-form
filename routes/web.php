<?php

use Illuminate\Support\Facades\Route;

// Home route — serves our React + Polaris app.
// SHOPIFY_MANUAL_ROUTES=home disables the package's default home route
// so we can register our own here.
Route::get('/', function () {
    return view('shopify');
})
->middleware(['verify.shopify'])
->name('home');
