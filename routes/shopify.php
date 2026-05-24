<?php

use Illuminate\Support\Facades\Route;

Route::middleware([\App\Http\Middleware\Shopify\VerifyShopify::class])->group(function () {
    Route::get('/shopify/app',     fn(\Illuminate\Http\Request $r) => view('shopify', ['shopDomain' => $r->query('shop', '')]))->name('home');
    Route::get('/shopify/pricing', fn(\Illuminate\Http\Request $r) => view('shopify', ['shopDomain' => $r->query('shop', '')]));
});
