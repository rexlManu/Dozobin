<?php

namespace Database\Factories;

use App\Models\TransferSession;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<TransferSession>
 */
class TransferSessionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'access_code' => Str::upper(Str::random(8)),
            'last_activity_at' => now(),
            'expires_at' => now()->addHours(12),
        ];
    }
}
