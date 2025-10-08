<?php

use App\Http\Controllers\AlignmentController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\PollController;
use App\Http\Controllers\WeekStatusController;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('week-status.index');
    }

    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function (): RedirectResponse {
        return redirect()->route('week-status.index');
    })->name('dashboard');

    Route::get('week-status', [WeekStatusController::class, 'index'])->name('week-status.index');
    Route::post('week-status', [WeekStatusController::class, 'upsert'])->name('week-status.upsert');
    Route::delete('week-status', [WeekStatusController::class, 'destroy'])->name('week-status.destroy');
    Route::get('alignment', [AlignmentController::class, 'index'])->name('alignment.index');

    // Group routes
    Route::get('groups', [GroupController::class, 'index'])->name('groups.index');
    Route::get('groups/create', [GroupController::class, 'create'])->name('groups.create');
    Route::post('groups', [GroupController::class, 'store'])->name('groups.store');
    Route::get('groups/{group}', [GroupController::class, 'show'])->name('groups.show');
    Route::post('groups/join', [GroupController::class, 'join'])->name('groups.join');
    Route::get('groups/join/{link}', [GroupController::class, 'joinByLink'])->name('groups.join-link');
    Route::delete('groups/{group}/leave', [GroupController::class, 'leave'])->name('groups.leave');
    Route::delete('groups/{group}/members', [GroupController::class, 'removeMember'])->name('groups.remove-member');
    Route::patch('groups/{group}/members/role', [GroupController::class, 'updateMemberRole'])->name('groups.update-member-role');
    Route::delete('groups/{group}', [GroupController::class, 'destroy'])->name('groups.destroy');

    // Route::get('poll', [PollController::class, 'index'])->name('poll.index');
    // Route::post('poll/vote', [PollController::class, 'vote'])->name('poll.vote');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

Route::post('/locale', function (Request $request): RedirectResponse {
    $locale = $request->string('locale')->toString();
    if (! in_array($locale, ['en', 'sv'], true)) {
        $locale = config('app.fallback_locale');
    }
    $request->session()->put('locale', $locale);

    return back();
})->name('locale.set');
