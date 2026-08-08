<?php

namespace Database\Factories;

use App\Models\InviteCode;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<InviteCode> */
class InviteCodeFactory extends Factory
{
    public function definition(): array
    {
        $code = 'DOZO-'.Str::upper(Str::random(4)).'-'.Str::upper(Str::random(4)).'-'.Str::upper(Str::random(4));

        return [
            'created_by_user_id' => User::factory()->admin(),
            'name' => fake()->words(2, true),
            'code' => $code,
            'code_hash' => InviteCode::hashCode($code),
            'max_uses' => null,
            'uses' => 0,
            'expires_at' => null,
            'revoked_at' => null,
        ];
    }

    public function expired(): static
    {
        return $this->state(fn (): array => ['expires_at' => now()->subMinute()]);
    }

    public function exhausted(): static
    {
        return $this->state(fn (): array => ['max_uses' => 1, 'uses' => 1]);
    }

    public function revoked(): static
    {
        return $this->state(fn (): array => ['revoked_at' => now()]);
    }
}
