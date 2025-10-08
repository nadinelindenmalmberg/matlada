<?php

use App\Models\Group;
use App\Models\User;
use App\Models\UserDayStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows multiple users to join the same group', function () {
    $creator = User::factory()->create();
    $group = Group::factory()->create(['created_by' => $creator->id]);
    $group->users()->attach($creator->id, ['role' => 'admin']);
    
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $user3 = User::factory()->create();
    
    // All users join the group
    $group->users()->attach($user1->id, ['role' => 'member']);
    $group->users()->attach($user2->id, ['role' => 'member']);
    $group->users()->attach($user3->id, ['role' => 'member']);
    
    expect($group->users)->toHaveCount(4); // Creator + 3 members
    expect($group->users->pluck('id'))->toContain($creator->id, $user1->id, $user2->id, $user3->id);
});

it('shows all group members in week status view', function () {
    $creator = User::factory()->create();
    $group = Group::factory()->create(['created_by' => $creator->id]);
    $group->users()->attach($creator->id, ['role' => 'admin']);
    
    $member1 = User::factory()->create();
    $member2 = User::factory()->create();
    $member3 = User::factory()->create();
    
    $group->users()->attach($member1->id, ['role' => 'member']);
    $group->users()->attach($member2->id, ['role' => 'member']);
    $group->users()->attach($member3->id, ['role' => 'member']);
    
    // Test as creator
    $this->actingAs($creator);
    $response = $this->get("/week-status?group={$group->id}");
    
    $response->assertOk();
    $response->assertInertia(fn ($page) => 
        $page->component('week-status/index')
            ->has('users', 4) // Creator + 3 members
            ->where('users.0.id', $creator->id) // Creator first
    );
    
    // Test as member
    $this->actingAs($member1);
    $response = $this->get("/week-status?group={$group->id}");
    
    $response->assertOk();
    $response->assertInertia(fn ($page) => 
        $page->component('week-status/index')
            ->has('users', 4)
    );
});

it('allows multiple users to create statuses in the same group', function () {
    $creator = User::factory()->create();
    $group = Group::factory()->create(['created_by' => $creator->id]);
    $group->users()->attach($creator->id, ['role' => 'admin']);
    
    $member1 = User::factory()->create();
    $member2 = User::factory()->create();
    
    $group->users()->attach($member1->id, ['role' => 'member']);
    $group->users()->attach($member2->id, ['role' => 'member']);
    
    // Creator creates status
    $this->actingAs($creator);
    $this->post('/week-status', [
        'iso_week' => '2025-W40',
        'weekday' => 1,
        'status' => 'Lunchbox',
        'arrival_time' => '12:00',
        'location' => 'Bulten',
        'group_id' => $group->id,
    ]);
    
    // Member 1 creates status
    $this->actingAs($member1);
    $this->post('/week-status', [
        'iso_week' => '2025-W40',
        'weekday' => 1,
        'status' => 'Buying',
        'arrival_time' => '12:30',
        'location' => 'Lindholmen',
        'group_id' => $group->id,
    ]);
    
    // Member 2 creates status
    $this->actingAs($member2);
    $this->post('/week-status', [
        'iso_week' => '2025-W40',
        'weekday' => 1,
        'status' => 'Home',
        'group_id' => $group->id,
    ]);
    
    // Verify all statuses exist
    $this->assertDatabaseHas('user_day_statuses', [
        'user_id' => $creator->id,
        'group_id' => $group->id,
        'status' => 'Lunchbox',
    ]);
    
    $this->assertDatabaseHas('user_day_statuses', [
        'user_id' => $member1->id,
        'group_id' => $group->id,
        'status' => 'Buying',
    ]);
    
    $this->assertDatabaseHas('user_day_statuses', [
        'user_id' => $member2->id,
        'group_id' => $group->id,
        'status' => 'Home',
    ]);
});

it('allows users to be in multiple groups simultaneously', function () {
    $user = User::factory()->create();
    
    $group1 = Group::factory()->create(['created_by' => $user->id]);
    $group1->users()->attach($user->id, ['role' => 'admin']);
    
    $group2 = Group::factory()->create(['created_by' => $user->id]);
    $group2->users()->attach($user->id, ['role' => 'admin']);
    
    $otherUser = User::factory()->create();
    $group1->users()->attach($otherUser->id, ['role' => 'member']);
    $group2->users()->attach($otherUser->id, ['role' => 'member']);
    
    // User should be in both groups
    expect($user->groups)->toHaveCount(2);
    expect($user->groups->pluck('id'))->toContain($group1->id, $group2->id);
    
    // Other user should also be in both groups
    expect($otherUser->groups)->toHaveCount(2);
    expect($otherUser->groups->pluck('id'))->toContain($group1->id, $group2->id);
});

it('creates separate statuses for different groups', function () {
    $user = User::factory()->create();
    
    $group1 = Group::factory()->create(['created_by' => $user->id]);
    $group1->users()->attach($user->id, ['role' => 'admin']);
    
    $group2 = Group::factory()->create(['created_by' => $user->id]);
    $group2->users()->attach($user->id, ['role' => 'admin']);
    
    // Create statuses in different groups
    $this->actingAs($user);
    
    $this->post('/week-status', [
        'iso_week' => '2025-W40',
        'weekday' => 1,
        'status' => 'Lunchbox',
        'group_id' => $group1->id,
    ]);
    
    $this->post('/week-status', [
        'iso_week' => '2025-W40',
        'weekday' => 1,
        'status' => 'Buying',
        'group_id' => $group2->id,
    ]);
    
    // Should have separate statuses for each group
    $this->assertDatabaseHas('user_day_statuses', [
        'user_id' => $user->id,
        'group_id' => $group1->id,
        'status' => 'Lunchbox',
    ]);
    
    $this->assertDatabaseHas('user_day_statuses', [
        'user_id' => $user->id,
        'group_id' => $group2->id,
        'status' => 'Buying',
    ]);
});

it('handles group with many members efficiently', function () {
    $creator = User::factory()->create();
    $group = Group::factory()->create(['created_by' => $creator->id]);
    $group->users()->attach($creator->id, ['role' => 'admin']);
    
    // Create 10 members
    $members = User::factory()->count(10)->create();
    foreach ($members as $member) {
        $group->users()->attach($member->id, ['role' => 'member']);
    }
    
    // Test that we can still view the group
    $this->actingAs($creator);
    $response = $this->get("/groups/{$group->id}");
    
    $response->assertOk();
    $response->assertInertia(fn ($page) => 
        $page->component('groups/show')
            ->has('group')
            ->where('group.id', $group->id)
    );
    
    // Test week status view with many members
    $response = $this->get("/week-status?group={$group->id}");
    
    $response->assertOk();
    $response->assertInertia(fn ($page) => 
        $page->component('week-status/index')
            ->has('users', 11) // Creator + 10 members
    );
});