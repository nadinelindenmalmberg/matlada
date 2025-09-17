<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

it('saves and returns location with week status', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $week = Carbon::now()->isoFormat('GGGG-[W]WW');

    $response = $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)->post('/week-status', [
        'iso_week' => $week,
        'weekday' => 3,
        'status' => 'Lunchbox',
        'arrival_time' => '08:30',
        'location' => 'Library',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('user_day_statuses', [
        'user_id' => $user->id,
        'iso_week' => $week,
        'weekday' => 3,
        'status' => 'Lunchbox',
        'arrival_time' => '08:30',
        'location' => 'Library',
    ]);

    $page = $this->get('/week-status');
    $page->assertSuccessful();
});

it('accepts Home status', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $week = Carbon::now()->isoFormat('GGGG-[W]WW');

    $response = $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)->post('/week-status', [
        'iso_week' => $week,
        'weekday' => 2,
        'status' => 'Home',
        'arrival_time' => null,
        'location' => null,
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('user_day_statuses', [
        'user_id' => $user->id,
        'iso_week' => $week,
        'weekday' => 2,
        'status' => 'Home',
    ]);
});
