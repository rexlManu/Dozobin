<?php

use App\Models\InstallationSetting;
use App\Models\TransferItem;
use App\Models\TransferSession;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    InstallationSetting::factory()->create(['transfer_window_hours' => 4]);
    Storage::fake('local');
});

it('creates, joins, and adds items to a transfer session', function (): void {
    $created = $this->postJson('/transfers')->assertCreated();
    $code = $created->json('data.code');

    expect($code)->toBeString()->toHaveLength(8);

    $this->postJson("/transfers/{$code}/items", ['body' => 'Across devices'])
        ->assertCreated()
        ->assertJsonPath('data.kind', 'text');

    $this->postJson("/transfers/{$code}/items", [
        'file' => UploadedFile::fake()->image('capture.png'),
    ])->assertCreated()->assertJsonPath('data.kind', 'image');

    expect(TransferItem::query()->count())->toBe(2);
    $file = TransferItem::query()->whereNotNull('storage_path')->sole();
    Storage::disk('local')->assertExists((string) $file->storage_path);

    $this->postJson("/transfers/{$code}/touch", ['note' => 'downloaded capture.png'])
        ->assertOk();
    $this->assertDatabaseHas('transfer_activities', ['description' => 'downloaded capture.png']);
});

it('provides transfer items to the page as a plain array', function (): void {
    $session = TransferSession::factory()->create();
    $item = TransferItem::factory()->create([
        'transfer_session_id' => $session->id,
    ]);

    $this->get("/transfer/{$session->access_code}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('transfers/show')
            ->has('transfer.items', 1)
            ->where('transfer.items.0.id', (string) $item->id));
});

it('purges expired transfer items and rejects the join', function (): void {
    $session = TransferSession::factory()->create([
        'last_activity_at' => now()->subHours(13),
        'expires_at' => now()->subMinute(),
    ]);
    $item = TransferItem::factory()->create([
        'transfer_session_id' => $session->id,
        'storage_path' => "transfers/{$session->access_code}/old.txt",
    ]);
    Storage::disk('local')->put((string) $item->storage_path, 'old');

    $this->postJson('/transfers/join', ['code' => $session->access_code])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('code');

    $this->assertDatabaseMissing('transfer_items', ['id' => $item->id]);
    Storage::disk('local')->assertMissing((string) $item->storage_path);
    expect($session->fresh()->expired_at)->not->toBeNull();
});

it('renders the expired transfer page while purging its payload', function (): void {
    $session = TransferSession::factory()->create([
        'expires_at' => now()->subMinute(),
    ]);
    $item = TransferItem::factory()->create([
        'transfer_session_id' => $session->id,
    ]);

    $this->get("/transfer/{$session->access_code}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('transfers/show')
            ->where('transfer.expired', true)
            ->has('transfer.items', 0));

    $this->assertDatabaseMissing('transfer_items', ['id' => $item->id]);
});
