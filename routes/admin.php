<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use Illuminate\Support\Facades\Route;

Route::get('/admin',                   [AdminDashboardController::class, 'index']);
Route::get('/admin/merchant/{id}',     [AdminDashboardController::class, 'merchantPage']);

Route::prefix('api/admin')->group(function () {
    Route::get('stats',           [AdminDashboardController::class, 'stats']);
    Route::get('merchants',       [AdminDashboardController::class, 'merchants']);
    Route::get('merchants/{id}',  [AdminDashboardController::class, 'merchantDetail']);
});
