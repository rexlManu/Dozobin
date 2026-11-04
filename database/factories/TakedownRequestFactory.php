<?php

namespace Database\Factories;

use App\Enums\TakedownReason;
use App\Enums\TakedownStatus;
use App\Models\Share;
use App\Models\TakedownRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TakedownRequest>
 */
class TakedownRequestFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'share_id' => null,
            'share_url' => 'https://dozobin.test/s/'.strtolower(fake()->bothify('????????????????????')),
            'reason' => TakedownReason::Copyright,
            'details' => fake()->paragraph(),
            'reporter_name' => fake()->name(),
            'reporter_email' => fake()->safeEmail(),
            'status' => TakedownStatus::Open,
        ];
    }

    public function forShare(Share $share): static
    {
        return $this->state(fn (): array => [
            'share_id' => $share->id,
            'share_url' => $share->url(),
        ]);
    }

    public function handled(TakedownStatus $status, ?User $by = null): static
    {
        return $this->state(fn (): array => [
            'status' => $status,
            'handled_by_user_id' => $by?->id,
            'handled_at' => now(),
        ]);
    }
}
