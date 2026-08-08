<?php

namespace App\Actions\Shares;

use App\Data\CreateFileShareData;
use App\Enums\ShareKind;
use App\Enums\ShareState;
use App\Models\InstallationSetting;
use App\Models\Share;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

final class CreateFileShareAction
{
    public function __construct(private QueueMalwareScanAction $queueMalwareScan) {}

    public function handle(?User $user, CreateFileShareData $data): Share
    {
        $slug = Str::lower(Str::random(20));
        $path = $data->file->storeAs(
            "shares/{$slug}",
            Str::random(16).'.'.$data->file->getClientOriginalExtension(),
        );
        if (! is_string($path)) {
            throw new RuntimeException('The uploaded file could not be stored.');
        }

        try {
            $share = Share::query()->create([
                'slug' => $slug,
                'user_id' => $user?->id,
                'kind' => ShareKind::File,
                'state' => ShareState::Ready,
                'filename' => $data->file->getClientOriginalName(),
                'mime_type' => $data->file->getMimeType() ?: 'application/octet-stream',
                'size_bytes' => $data->file->getSize(),
                'storage_path' => $path,
                'password' => $data->password === null ? null : Hash::make($data->password),
                'expires_at' => $data->expiration->expiresAt(),
            ]);

        } catch (Throwable $exception) {
            Storage::delete($path);
            throw $exception;
        }

        if (InstallationSetting::current()->malware_scanning_enabled) {
            $this->queueMalwareScan->handle($share);
        }

        return $share->refresh();
    }
}
