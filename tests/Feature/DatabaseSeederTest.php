<?php

use App\Enums\ShareState;
use App\Enums\TakedownStatus;
use App\Models\Share;
use App\Models\TakedownRequest;
use App\Models\User;
use App\Services\FileStore;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Storage;

it('seeds the demo studio with every share state and real files', function (): void {
    Storage::fake(app(FileStore::class)->diskName());

    $this->seed(DatabaseSeeder::class);

    expect(User::query()->pluck('email')->all())->toContain('admin@dozobin.test', 'member@dozobin.test')
        ->and(Share::query()->pluck('state')->unique()->values()->all())
        ->toEqualCanonicalizing([ShareState::Ready, ShareState::Blocked, ShareState::Unavailable])
        ->and(TakedownRequest::query()->where('status', TakedownStatus::Open)->count())->toBe(2);

    Share::query()->whereNotNull('storage_path')->each(function (Share $share): void {
        expect(Storage::disk(app(FileStore::class)->diskName())->size($share->storage_path))->toBe($share->size_bytes);
    });
});
