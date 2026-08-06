<?php

namespace Database\Factories;

use App\Models\TransferActivity;
use App\Models\TransferSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TransferActivity>
 */
class TransferActivityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'transfer_session_id' => TransferSession::factory(),
            'actor' => fake()->firstName(),
            'description' => fake()->randomElement(['joined the session', 'added a file', 'downloaded an item']),
        ];
    }
}
