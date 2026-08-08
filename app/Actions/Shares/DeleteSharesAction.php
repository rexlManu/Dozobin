<?php

namespace App\Actions\Shares;

use App\Models\Share;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class DeleteSharesAction
{
    public function __construct(private RemoveSharePayloadAction $removePayload) {}

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
                $this->removePayload->handle($share);
                $share->delete();
            }
        });
    }
}
