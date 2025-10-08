<?php

use App\Models\Group;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

it('displays groups index page', function () {
    $group = Group::factory()->create(['created_by' => $this->user->id]);
    $group->users()->attach($this->user->id, ['role' => 'admin']);
    
    $response = $this->get('/groups');
    
    $response->assertOk();
    $response->assertInertia(fn ($page) => 
        $page->component('groups/index')
            ->has('groups', 1)
            ->where('groups.0.id', $group->id)
    );
});

it('displays create group page', function () {
    $response = $this->get('/groups/create');
    
    $response->assertOk();
    $response->assertInertia(fn ($page) => 
        $page->component('groups/create')
    );
});

it('creates a new group', function () {
    $groupData = [
        'name' => 'Test Group',
        'description' => 'A test group description',
    ];
    
    $response = $this->post('/groups', $groupData);
    
    $response->assertRedirect();
    
    $this->assertDatabaseHas('groups', [
        'name' => 'Test Group',
        'description' => 'A test group description',
        'created_by' => $this->user->id,
        'is_active' => true,
    ]);
    
    $group = Group::where('name', 'Test Group')->first();
    expect($group->code)->toHaveLength(6);
    expect($group->invite_link)->toHaveLength(32);
    
    // Creator should be added as admin
    $this->assertDatabaseHas('group_user', [
        'group_id' => $group->id,
        'user_id' => $this->user->id,
        'role' => 'admin',
    ]);
});

it('validates group creation data', function () {
    $response = $this->post('/groups', []);
    
    $response->assertSessionHasErrors(['name']);
});

it('displays group show page', function () {
    $group = Group::factory()->create(['created_by' => $this->user->id]);
    $group->users()->attach($this->user->id, ['role' => 'admin']);
    
    $response = $this->get("/groups/{$group->id}");
    
    $response->assertOk();
    $response->assertInertia(fn ($page) => 
        $page->component('groups/show')
            ->has('group')
            ->where('group.id', $group->id)
    );
});

it('prevents non-members from viewing group', function () {
    $otherUser = User::factory()->create();
    $group = Group::factory()->create(['created_by' => $otherUser->id]);
    
    $response = $this->get("/groups/{$group->id}");
    
    $response->assertForbidden();
});

it('allows user to join group by code', function () {
    $otherUser = User::factory()->create();
    $group = Group::factory()->create(['created_by' => $otherUser->id]);
    
    $response = $this->post('/groups/join', [
        'code' => $group->code,
    ]);
    
    $response->assertRedirect();
    
    $this->assertDatabaseHas('group_user', [
        'group_id' => $group->id,
        'user_id' => $this->user->id,
        'role' => 'member',
    ]);
});

it('allows user to join group by invite link', function () {
    $otherUser = User::factory()->create();
    $group = Group::factory()->create(['created_by' => $otherUser->id]);
    
    $response = $this->get("/groups/join/{$group->invite_link}");
    
    $response->assertRedirect();
    
    $this->assertDatabaseHas('group_user', [
        'group_id' => $group->id,
        'user_id' => $this->user->id,
        'role' => 'member',
    ]);
});

it('prevents joining group with invalid code', function () {
    $response = $this->post('/groups/join', [
        'code' => 'INVALID',
    ]);
    
    $response->assertSessionHasErrors(['code']);
});

it('prevents joining group with invalid invite link', function () {
    $response = $this->get('/groups/join/invalid-link');
    
    $response->assertRedirect();
});

it('allows user to leave group', function () {
    $otherUser = User::factory()->create();
    $group = Group::factory()->create(['created_by' => $otherUser->id]);
    $group->users()->attach($this->user->id, ['role' => 'member']);
    
    $response = $this->delete("/groups/{$group->id}/leave");
    
    $response->assertRedirect('/groups');
    
    $this->assertDatabaseMissing('group_user', [
        'group_id' => $group->id,
        'user_id' => $this->user->id,
    ]);
});

it('prevents non-members from leaving group', function () {
    $otherUser = User::factory()->create();
    $group = Group::factory()->create(['created_by' => $otherUser->id]);
    
    $response = $this->delete("/groups/{$group->id}/leave");
    
    $response->assertForbidden();
});

it('allows admin to remove member', function () {
    $otherUser = User::factory()->create();
    $group = Group::factory()->create(['created_by' => $this->user->id]);
    $group->users()->attach($this->user->id, ['role' => 'admin']);
    $group->users()->attach($otherUser->id, ['role' => 'member']);
    
    $response = $this->delete("/groups/{$group->id}/members", [
        'user_id' => $otherUser->id,
    ]);
    
    $response->assertRedirect();
    
    $this->assertDatabaseMissing('group_user', [
        'group_id' => $group->id,
        'user_id' => $otherUser->id,
    ]);
});

it('prevents non-admin from removing members', function () {
    $otherUser = User::factory()->create();
    $group = Group::factory()->create(['created_by' => $otherUser->id]);
    $group->users()->attach($this->user->id, ['role' => 'member']);
    
    $response = $this->delete("/groups/{$group->id}/members", [
        'user_id' => $otherUser->id,
    ]);
    
    $response->assertForbidden();
});

it('allows admin to update member role', function () {
    $otherUser = User::factory()->create();
    $group = Group::factory()->create(['created_by' => $this->user->id]);
    $group->users()->attach($this->user->id, ['role' => 'admin']);
    $group->users()->attach($otherUser->id, ['role' => 'member']);
    
    $response = $this->patch("/groups/{$group->id}/members/role", [
        'user_id' => $otherUser->id,
        'role' => 'admin',
    ]);
    
    $response->assertRedirect();
    
    $this->assertDatabaseHas('group_user', [
        'group_id' => $group->id,
        'user_id' => $otherUser->id,
        'role' => 'admin',
    ]);
});

it('allows creator to delete group', function () {
    $group = Group::factory()->create(['created_by' => $this->user->id]);
    
    $response = $this->delete("/groups/{$group->id}");
    
    $response->assertRedirect();
    
    $this->assertDatabaseMissing('groups', [
        'id' => $group->id,
    ]);
});

it('prevents non-creator from deleting group', function () {
    $otherUser = User::factory()->create();
    $group = Group::factory()->create(['created_by' => $otherUser->id]);
    $group->users()->attach($this->user->id, ['role' => 'admin']);
    
    $response = $this->delete("/groups/{$group->id}");
    
    $response->assertForbidden();
});