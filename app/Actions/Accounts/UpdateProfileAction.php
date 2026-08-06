<?php

namespace App\Actions\Accounts;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

final class UpdateProfileAction
{
    /** @param array<string, mixed> $data */
    public function handle(User $user, array $data, ?UploadedFile $avatar): User
    {
        $user->fill(Arr::only($data, ['name', 'email', 'appearance', 'default_expiration']));

        if (($data['remove_avatar'] ?? false) === true) {
            if ($user->avatar_path !== null) {
                Storage::disk('public')->delete($user->avatar_path);
            }
            $user->avatar_path = null;
        } elseif ($avatar !== null) {
            if ($user->avatar_path !== null) {
                Storage::disk('public')->delete($user->avatar_path);
            }
            $path = $avatar->store('avatars', 'public');
            if (! is_string($path)) {
                throw new RuntimeException('The avatar could not be stored.');
            }
            $user->avatar_path = $path;
        }

        $user->save();

        return $user->refresh();
    }
}
