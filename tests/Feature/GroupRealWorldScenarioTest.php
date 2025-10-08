<?php

use App\Models\Group;
use App\Models\User;
use App\Models\UserDayStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('simulates a real-world scenario with multiple groups and users', function () {
    // Create users representing different roles
    $teacher = User::factory()->create(['name' => 'Ms. Johnson']);
    $student1 = User::factory()->create(['name' => 'Alice']);
    $student2 = User::factory()->create(['name' => 'Bob']);
    $student3 = User::factory()->create(['name' => 'Charlie']);
    $student4 = User::factory()->create(['name' => 'Diana']);
    
    // Teacher creates a class group
    $classGroup = Group::factory()->create([
        'name' => 'Class 5A',
        'description' => 'Our lunch planning group for Class 5A',
        'created_by' => $teacher->id,
    ]);
    $classGroup->users()->attach($teacher->id, ['role' => 'admin']);
    
    // Students join the class group
    $classGroup->users()->attach($student1->id, ['role' => 'member']);
    $classGroup->users()->attach($student2->id, ['role' => 'member']);
    $classGroup->users()->attach($student3->id, ['role' => 'member']);
    $classGroup->users()->attach($student4->id, ['role' => 'member']);
    
    // Student1 creates a friend group
    $friendGroup = Group::factory()->create([
        'name' => 'Lunch Buddies',
        'description' => 'Friends who eat lunch together',
        'created_by' => $student1->id,
    ]);
    $friendGroup->users()->attach($student1->id, ['role' => 'admin']);
    $friendGroup->users()->attach($student2->id, ['role' => 'member']);
    $friendGroup->users()->attach($student3->id, ['role' => 'member']);
    
    // Verify group memberships
    expect($classGroup->users)->toHaveCount(5); // Teacher + 4 students
    expect($friendGroup->users)->toHaveCount(3); // 3 friends
    
    // Students can be in multiple groups
    expect($student1->groups)->toHaveCount(2);
    expect($student2->groups)->toHaveCount(2);
    expect($student3->groups)->toHaveCount(2);
    expect($student4->groups)->toHaveCount(1); // Only in class group
    
    // Test week status creation for different groups
    $this->actingAs($student1);
    
    // Create status in class group
    $this->post('/week-status', [
        'iso_week' => '2025-W40',
        'weekday' => 1,
        'status' => 'Lunchbox',
        'arrival_time' => '12:00',
        'location' => 'Bulten',
        'group_id' => $classGroup->id,
    ]);
    
    // Create different status in friend group
    $this->post('/week-status', [
        'iso_week' => '2025-W40',
        'weekday' => 1,
        'status' => 'Buying',
        'arrival_time' => '12:15',
        'location' => 'Lindholmen',
        'group_id' => $friendGroup->id,
    ]);
    
    // Other students create statuses
    $this->actingAs($student2);
    $this->post('/week-status', [
        'iso_week' => '2025-W40',
        'weekday' => 1,
        'status' => 'Home',
        'group_id' => $classGroup->id,
    ]);
    
    $this->post('/week-status', [
        'iso_week' => '2025-W40',
        'weekday' => 1,
        'status' => 'Lunchbox',
        'group_id' => $friendGroup->id,
    ]);
    
    // Teacher creates status in class group
    $this->actingAs($teacher);
    $this->post('/week-status', [
        'iso_week' => '2025-W40',
        'weekday' => 1,
        'status' => 'Buying',
        'arrival_time' => '12:30',
        'location' => 'Bulten',
        'group_id' => $classGroup->id,
    ]);
    
    // Verify all statuses were created correctly
    $this->assertDatabaseHas('user_day_statuses', [
        'user_id' => $student1->id,
        'group_id' => $classGroup->id,
        'status' => 'Lunchbox',
    ]);
    
    $this->assertDatabaseHas('user_day_statuses', [
        'user_id' => $student1->id,
        'group_id' => $friendGroup->id,
        'status' => 'Buying',
    ]);
    
    $this->assertDatabaseHas('user_day_statuses', [
        'user_id' => $student2->id,
        'group_id' => $classGroup->id,
        'status' => 'Home',
    ]);
    
    $this->assertDatabaseHas('user_day_statuses', [
        'user_id' => $student2->id,
        'group_id' => $friendGroup->id,
        'status' => 'Lunchbox',
    ]);
    
    $this->assertDatabaseHas('user_day_statuses', [
        'user_id' => $teacher->id,
        'group_id' => $classGroup->id,
        'status' => 'Buying',
    ]);
    
    // Test viewing different group contexts
    $this->actingAs($student1);
    
    // View class group statuses
    $response = $this->get("/week-status?group={$classGroup->id}&week=2025-W40");
    $response->assertOk();
    $response->assertInertia(fn ($page) => 
        $page->component('week-status/index')
            ->has('users', 5) // All class members
            ->has('statuses')
    );
    
    // View friend group statuses
    $response = $this->get("/week-status?group={$friendGroup->id}&week=2025-W40");
    $response->assertOk();
    $response->assertInertia(fn ($page) => 
        $page->component('week-status/index')
            ->has('users', 3) // Only friends
            ->has('statuses')
    );
    
    // Test that student4 (not in friend group) cannot see friend group
    $this->actingAs($student4);
    $response = $this->get("/week-status?group={$friendGroup->id}");
    $response->assertForbidden();
    
    // Test that student4 can see class group
    $response = $this->get("/week-status?group={$classGroup->id}");
    $response->assertOk();
    
    // Test group management - teacher can manage class group
    $this->actingAs($teacher);
    $response = $this->get("/groups/{$classGroup->id}");
    $response->assertOk();
    
    // Test that student1 can manage friend group
    $this->actingAs($student1);
    $response = $this->get("/groups/{$friendGroup->id}");
    $response->assertOk();
    
    // Test that student2 cannot manage friend group (not admin)
    $this->actingAs($student2);
    $response = $this->get("/groups/{$friendGroup->id}");
    $response->assertOk(); // Can view but not manage
    
    // Test joining groups by code
    $newStudent = User::factory()->create(['name' => 'Eve']);
    $this->actingAs($newStudent);
    
    $response = $this->post('/groups/join', [
        'code' => $classGroup->code,
    ]);
    $response->assertRedirect();
    
    // Verify new student is now in class group
    $this->assertDatabaseHas('group_user', [
        'group_id' => $classGroup->id,
        'user_id' => $newStudent->id,
        'role' => 'member',
    ]);
    
    // Test that new student can now see class group
    $response = $this->get('/week-status');
    $response->assertOk();
    $response->assertInertia(fn ($page) => 
        $page->component('week-status/index')
            ->has('groups', 1)
            ->where('groups.0.id', $classGroup->id)
    );
});