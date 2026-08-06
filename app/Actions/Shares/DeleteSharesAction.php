<?php

namespace App\Actions\Shares;

use App\Enums\ShareKind;
use App\Models\Share;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

final class DeleteSharesAction
{
    /** @param Collection<int, Share> $shares */
    public function handle(User $user, Collection $shares): void
    {
        foreach ($shares as $share) {
            if (Gate::forUser($user)->denies('delete', $share)) {
                throw new AuthorizationException;
            }
        }

        DB::transaction(function () use ($shares): void {
            foreach ($shares as $share) {
                if ($share->kind === ShareKind::File && $share->storage_path !== null) {
                    Storage::delete($share->storage_path);
                }
                $share->delete();
            }
        });
    }
}
