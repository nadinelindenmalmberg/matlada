<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\WeekStatusController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

	Route::get('week-status', [WeekStatusController::class, 'index'])->name('week-status.index');
	Route::post('week-status', [WeekStatusController::class, 'upsert'])->name('week-status.upsert');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
