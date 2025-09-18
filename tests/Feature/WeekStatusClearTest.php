<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

it('allows a user to clear their day status', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $week = Carbon::now()->isoFormat('GGGG-[W]WW');

    // Seed a status first
    $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)->post('/week-status', [
        'iso_week' => $week,
        'weekday' => 4,
        'status' => 'Buying',
        'arrival_time' => '08:00',
        'location' => 'Bulten',
    ])->assertRedirect();

    $this->assertDatabaseHas('user_day_statuses', [
        'user_id' => $user->id,
        'iso_week' => $week,
        'weekday' => 4,
        'status' => 'Buying',
        'location' => 'Bulten',
    ]);

    // Clear it
    $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)->delete('/week-status', [
        'iso_week' => $week,
        'weekday' => 4,
    ])->assertRedirect();

    $this->assertDatabaseMissing('user_day_statuses', [
        'user_id' => $user->id,
        'iso_week' => $week,
        'weekday' => 4,
    ]);
});
