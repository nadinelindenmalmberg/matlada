<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

it('keeps both eat_location and note across partial updates', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $week = Carbon::now()->isoFormat('GGGG-[W]WW');

    // First set eat_location only
    $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)->post('/week-status', [
        'iso_week' => $week,
        'weekday' => 3,
        'status' => 'Lunchbox',
        'eat_location' => 'Bulten',
    ])->assertRedirect();

    $this->assertDatabaseHas('user_day_statuses', [
        'user_id' => $user->id,
        'iso_week' => $week,
        'weekday' => 3,
        'status' => 'Lunchbox',
        'eat_location' => 'Bulten',
    ]);

    // Then set note only (partial update) and ensure eat_location remains
    $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)->post('/week-status', [
        'iso_week' => $week,
        'weekday' => 3,
        'note' => 'Bring friends',
    ])->assertRedirect();

    $this->assertDatabaseHas('user_day_statuses', [
        'user_id' => $user->id,
        'iso_week' => $week,
        'weekday' => 3,
        'status' => 'Lunchbox',
        'eat_location' => 'Bulten',
        'note' => 'Bring friends',
    ]);
});
