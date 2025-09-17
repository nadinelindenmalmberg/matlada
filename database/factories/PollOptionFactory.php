<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PollOption>
 */
class PollOptionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $lunchOptions = [
            ['name' => 'Pizza Palace', 'description' => 'Great pizza and Italian food'],
            ['name' => 'Burger Barn', 'description' => 'Juicy burgers and fries'],
            ['name' => 'Sushi Spot', 'description' => 'Fresh sushi and Japanese cuisine'],
            ['name' => 'Taco Truck', 'description' => 'Authentic Mexican street food'],
            ['name' => 'Salad Bar', 'description' => 'Healthy salads and wraps'],
            ['name' => 'Thai Garden', 'description' => 'Spicy Thai cuisine'],
            ['name' => 'Pasta House', 'description' => 'Homemade pasta dishes'],
            ['name' => 'Sandwich Shop', 'description' => 'Fresh sandwiches and soups'],
        ];

        $option = $this->faker->randomElement($lunchOptions);

        return [
            'poll_id' => \App\Models\Poll::factory(),
            'name' => $option['name'],
            'description' => $option['description'],
            'vote_count' => $this->faker->numberBetween(0, 10),
        ];
    }
}
