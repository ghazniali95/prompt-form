<?php

use App\Http\Controllers\Admin\DashboardController;
use Illuminate\Support\Facades\Route;

Route::get('/admin',                   [DashboardController::class, 'index']);
Route::get('/admin/merchant/{id}',     [DashboardController::class, 'merchantPage']);

Route::prefix('api/admin')->group(function () {
    Route::get('stats',           [DashboardController::class, 'stats']);
    Route::get('merchants',       [DashboardController::class, 'merchants']);
    Route::get('merchants/{id}',  [DashboardController::class, 'merchantDetail']);
});
