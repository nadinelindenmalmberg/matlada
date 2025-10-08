<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Group;
use App\Models\UserDayStatus;
use App\Models\Poll;
use App\Models\PollOption;
use App\Models\Vote;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create main test user
        $testUser = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Create additional users for realistic group interactions
        $users = User::factory(15)->create();
        $allUsers = $users->push($testUser);

        // Create groups with realistic names
        $groups = collect([
            'Marketing Team',
            'Development Squad',
            'Design Studio',
            'Sales Force',
        ])->map(function ($name) use ($allUsers) {
            return Group::factory()->create([
                'name' => $name,
                'created_by' => $allUsers->random()->id,
            ]);
        });

        // Add users to groups (some users in multiple groups)
        foreach ($groups as $group) {
            // Add 5-8 random users to each group
            $groupUsers = $allUsers->random(rand(5, 8));
            foreach ($groupUsers as $user) {
                if (!$group->users()->where('user_id', $user->id)->exists()) {
                    $group->users()->attach($user->id);
                }
            }
        }

        // Create user day statuses for current week
        foreach ($groups as $group) {
            foreach ($group->users as $user) {
                // Create statuses for this week (weekdays 1-5, Monday to Friday)
                for ($i = 1; $i <= 5; $i++) {
                    UserDayStatus::factory()->create([
                        'user_id' => $user->id,
                        'group_id' => $group->id,
                        'iso_week' => now()->format('Y-\WW'),
                        'weekday' => $i,
                    ]);
                }
            }
        }

        // Create some polls for variety (polls are not group-specific in current schema)
        $polls = Poll::factory(3)->create();
        
        foreach ($polls as $poll) {
            // Add poll options
            $options = PollOption::factory(4)->create([
                'poll_id' => $poll->id,
            ]);

            // Add some votes from random users
            foreach ($allUsers->random(rand(5, 10)) as $user) {
                Vote::factory()->create([
                    'poll_id' => $poll->id,
                    'poll_option_id' => $options->random()->id,
                    'user_id' => $user->id,
                ]);
            }
        }
    }
}
