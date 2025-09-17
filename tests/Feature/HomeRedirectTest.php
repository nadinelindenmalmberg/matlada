<?php

use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('redirects authenticated users to week-status page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/');

    $response->assertRedirect(route('week-status.index'));
});

it('shows welcome page for unauthenticated users', function () {
    $response = $this->get('/');

    $response->assertOk();
    $response->assertInertia(fn($page) => $page->component('welcome'));
});
