<?php

namespace Database\Factories;

use App\Enums\TransferItemKind;
use App\Models\TransferItem;
use App\Models\TransferParticipant;
use App\Models\TransferSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TransferItem>
 */
class TransferItemFactory extends Factory
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
            'transfer_participant_id' => TransferParticipant::factory(),
            'kind' => TransferItemKind::Text,
            'name' => 'Text from a device',
            'mime_type' => 'text/plain',
            'size_bytes' => 42,
            'body' => fake()->sentence(),
        ];
    }
}
