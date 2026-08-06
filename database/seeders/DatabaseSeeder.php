<?php

namespace Database\Seeders;

use App\Enums\PasteType;
use App\Enums\ShareKind;
use App\Enums\ShareState;
use App\Enums\TransferItemKind;
use App\Models\InstallationSetting;
use App\Models\Share;
use App\Models\TransferSession;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

final class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        InstallationSetting::factory()->create();

        $member = User::factory()->create([
            'name' => 'Ines Mori',
            'email' => 'member@dozobin.test',
            'password' => 'password',
        ]);
        $admin = User::factory()->admin()->create([
            'name' => 'Ruben Ishikawa',
            'email' => 'admin@dozobin.test',
            'password' => 'password',
        ]);

        $imagePath = 'shares/morning-window/sample.svg';
        Storage::put($imagePath, '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#e2e5df"/><rect x="110" y="100" width="980" height="600" rx="12" fill="#1b1d1f"/><circle cx="860" cy="260" r="120" fill="#dae400"/><path d="M180 620L430 360l190 190 140-120 260 190z" fill="#737a80"/></svg>');

        Share::query()->create([
            'slug' => 'morningwindow7k2q9x', 'user_id' => $member->id, 'kind' => ShareKind::File,
            'state' => ShareState::Ready, 'filename' => 'morning-window.svg', 'mime_type' => 'image/svg+xml',
            'size_bytes' => Storage::size($imagePath), 'storage_path' => $imagePath, 'views' => 23,
            'expires_at' => now()->addDays(7),
        ]);
        Share::query()->create([
            'slug' => 'protectedbrief8m4p2', 'user_id' => $member->id, 'kind' => ShareKind::Paste,
            'state' => ShareState::Ready, 'mime_type' => 'text/markdown', 'size_bytes' => 164,
            'body' => "# Handoff notes\n\nThe deployment window starts at **14:00 UTC**.\n\n- Check the queue\n- Run the smoke test\n- Post the result",
            'paste_type' => PasteType::Markdown, 'password' => Hash::make('hinoki'), 'views' => 8,
            'expires_at' => now()->addDay(),
        ]);
        Share::query()->create([
            'slug' => 'typescriptsample4n8', 'user_id' => $member->id, 'kind' => ShareKind::Paste,
            'state' => ShareState::Ready, 'mime_type' => 'text/plain', 'size_bytes' => 104,
            'body' => "type Share = { id: string; expiresAt: number | null };\n\nexport const isLive = (share: Share) => !share.expiresAt || share.expiresAt > Date.now();",
            'paste_type' => PasteType::Code, 'language' => 'typescript', 'views' => 41,
            'expires_at' => now()->addDays(30),
        ]);
        Share::factory()->file()->create([
            'slug' => 'missingarchive2p7k9', 'user_id' => $member->id, 'filename' => 'project-archive.zip',
            'mime_type' => 'application/zip', 'state' => ShareState::Unavailable, 'storage_path' => null,
            'expires_at' => now()->addHours(5),
        ]);
        Share::factory()->count(5)->create(['user_id' => $admin->id]);

        $session = TransferSession::factory()->create(['access_code' => 'K7MQ2XPD']);
        $participant = $session->participants()->create([
            'browser_id' => '00000000-0000-4000-8000-000000000001',
            'label' => 'Ines’s phone', 'device' => 'Phone', 'joined_at' => now()->subMinutes(4),
        ]);
        $session->items()->create([
            'transfer_participant_id' => $participant->id, 'kind' => TransferItemKind::Text,
            'name' => 'Text from Ines’s phone', 'mime_type' => 'text/plain', 'size_bytes' => 43,
            'body' => 'The Wi-Fi password is on the back of the router.',
        ]);
        $session->activities()->create([
            'transfer_participant_id' => $participant->id, 'actor' => $participant->label,
            'description' => 'added text from the phone',
        ]);
    }
}
