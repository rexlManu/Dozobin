<?php

namespace App\Actions\Accounts;

use App\Models\User;
use App\Services\FileStore;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;

final class UpdateProfileAction
{
    public function __construct(private readonly FileStore $files) {}

    /** @param array<string, mixed> $data */
    public function handle(User $user, array $data, ?UploadedFile $avatar): User
    {
        $user->fill(Arr::only($data, ['name', 'email', 'appearance', 'default_expiration']));

        if (($data['remove_avatar'] ?? false) === true) {
            if ($user->avatar_path !== null) {
                $this->files->delete($user->avatar_path);
            }
            $user->avatar_path = null;
        } elseif ($avatar !== null) {
            $oldPath = $user->avatar_path;
            $path = $this->files->store($avatar, 'avatars');
            $user->avatar_path = $path;
            $user->save();

            if ($oldPath !== null && $this->files->exists($oldPath)) {
                $this->files->delete($oldPath);
            }

            return $user->refresh();
        }

        $user->save();

        return $user->refresh();
    }
}
