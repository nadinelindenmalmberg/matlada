<?php

use App\Models\Group;
use App\Models\User;
use App\Models\UserDayStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates a group with auto-generated code and invite link', function () {
    $user = User::factory()->create();
    
    $group = Group::create([
        'name' => 'Test Group',
        'description' => 'A test group',
        'created_by' => $user->id,
        'is_active' => true,
    ]);
    
    expect($group->code)->toHaveLength(6);
    expect($group->code)->toMatch('/^[A-Z0-9]{6}$/');
    expect($group->invite_link)->toHaveLength(32);
    expect($group->is_active)->toBeTrue();
});

it('generates unique codes for different groups', function () {
    $user = User::factory()->create();
    
    $group1 = Group::create([
        'name' => 'Group 1',
        'created_by' => $user->id,
    ]);
    
    $group2 = Group::create([
        'name' => 'Group 2',
        'created_by' => $user->id,
    ]);
    
    expect($group1->code)->not->toBe($group2->code);
});

it('generates unique invite links for different groups', function () {
    $user = User::factory()->create();
    
    $group1 = Group::create([
        'name' => 'Group 1',
        'created_by' => $user->id,
    ]);
    
    $group2 = Group::create([
        'name' => 'Group 2',
        'created_by' => $user->id,
    ]);
    
    expect($group1->invite_link)->not->toBe($group2->invite_link);
    expect($group1->invite_link)->toHaveLength(32);
    expect($group2->invite_link)->toHaveLength(32);
});

it('belongs to a creator', function () {
    $user = User::factory()->create();
    $group = Group::factory()->create(['created_by' => $user->id]);
    
    expect($group->creator)->toBeInstanceOf(User::class);
    expect($group->creator->id)->toBe($user->id);
});

it('has many users through pivot table', function () {
    $user = User::factory()->create();
    $group = Group::factory()->create(['created_by' => $user->id]);
    
    $member1 = User::factory()->create();
    $member2 = User::factory()->create();
    
    $group->users()->attach($member1->id, ['role' => 'member']);
    $group->users()->attach($member2->id, ['role' => 'admin']);
    
    expect($group->users)->toHaveCount(2);
    expect($group->users->pluck('id'))->toContain($member1->id, $member2->id);
});

it('checks if user is admin', function () {
    $user = User::factory()->create();
    $group = Group::factory()->create(['created_by' => $user->id]);
    
    $admin = User::factory()->create();
    $member = User::factory()->create();
    
    $group->users()->attach($admin->id, ['role' => 'admin']);
    $group->users()->attach($member->id, ['role' => 'member']);
    
    expect($group->isAdmin($admin))->toBeTrue();
    expect($group->isAdmin($member))->toBeFalse();
    expect($group->isAdmin($user))->toBeFalse(); // Creator is not automatically admin
});

it('checks if user is member', function () {
    $user = User::factory()->create();
    $group = Group::factory()->create(['created_by' => $user->id]);
    
    $member = User::factory()->create();
    $nonMember = User::factory()->create();
    
    $group->users()->attach($member->id, ['role' => 'member']);
    
    expect($group->isMember($member))->toBeTrue();
    expect($group->isMember($nonMember))->toBeFalse();
});

it('generates correct invite URLs', function () {
    $user = User::factory()->create();
    $group = Group::factory()->create(['created_by' => $user->id]);
    
    $inviteUrl = $group->getInviteUrl();
    $inviteLinkUrl = $group->getInviteLinkUrl();
    
    expect($inviteUrl)->toContain("/groups/join?code={$group->code}");
    expect($inviteLinkUrl)->toContain("/groups/join/{$group->invite_link}");
});

it('can be deactivated', function () {
    $user = User::factory()->create();
    $group = Group::factory()->create(['created_by' => $user->id]);
    
    $group->update(['is_active' => false]);
    
    expect($group->is_active)->toBeFalse();
});

it('has user day statuses', function () {
    $user = User::factory()->create();
    $group = Group::factory()->create(['created_by' => $user->id]);
    
    $status = UserDayStatus::factory()->create([
        'user_id' => $user->id,
        'group_id' => $group->id,
    ]);
    
    expect($group->userDayStatuses)->toHaveCount(1);
    expect($group->userDayStatuses->first()->id)->toBe($status->id);
});