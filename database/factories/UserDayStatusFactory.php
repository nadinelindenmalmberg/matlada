<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserDayStatus>
 */
class UserDayStatusFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'group_id' => null,
            'iso_week' => fake()->dateTimeBetween('-1 year', '+1 year')->format('Y-\WW'),
            'weekday' => fake()->numberBetween(1, 5),
            'status' => fake()->randomElement(['Lunchbox', 'Buying', 'Home']),
            'arrival_time' => fake()->time('H:i'),
            'location' => fake()->randomElement(['Bulten', 'Lindholmen', 'Other']),
        ];
    }
}
