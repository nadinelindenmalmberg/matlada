<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Poll>
 */
class PollFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'poll_date' => $this->faker->date(),
            'deadline' => '11:00:00',
            'is_active' => true,
        ];
    }

    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function withDeadlinePassed(): static
    {
        return $this->state(fn (array $attributes) => [
            'poll_date' => now()->subDay()->toDateString(),
        ]);
    }
}
