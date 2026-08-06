<?php

namespace Database\Factories;

use App\Models\TransferParticipant;
use App\Models\TransferSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TransferParticipant>
 */
class TransferParticipantFactory extends Factory
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
            'browser_id' => fake()->uuid(),
            'label' => fake()->firstName().'’s device',
            'device' => fake()->randomElement(['Phone', 'Laptop', 'Tablet']),
            'joined_at' => now(),
        ];
    }
}
