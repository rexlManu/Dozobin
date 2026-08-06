<?php

namespace Database\Factories;

use App\Enums\PasteType;
use App\Enums\ShareKind;
use App\Enums\ShareState;
use App\Models\Share;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Share>
 */
class ShareFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'slug' => strtolower(fake()->unique()->bothify('????????????????????')),
            'user_id' => User::factory(),
            'kind' => ShareKind::Paste,
            'state' => ShareState::Ready,
            'mime_type' => 'text/plain',
            'size_bytes' => 120,
            'body' => fake()->paragraphs(2, true),
            'paste_type' => PasteType::Text,
            'views' => fake()->numberBetween(0, 100),
            'expires_at' => now()->addDays(7),
        ];
    }

    public function file(): static
    {
        return $this->state(fn (): array => [
            'kind' => ShareKind::File,
            'filename' => fake()->word().'.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => fake()->numberBetween(10_000, 4_000_000),
            'body' => null,
            'paste_type' => null,
        ]);
    }

    public function protected(string $password = 'hinoki'): static
    {
        return $this->state(fn (): array => ['password' => \Hash::make($password)]);
    }

    public function expired(): static
    {
        return $this->state(fn (): array => ['expires_at' => now()->subHour()]);
    }
}
