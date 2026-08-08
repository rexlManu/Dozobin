<?php

namespace App\Actions\Accounts;

use App\Actions\Shares\DeleteSharesAction;
use App\Models\User;
use App\Services\FileStore;
use Illuminate\Support\Facades\DB;

final class DeleteAccountAction
{
    public function __construct(
        private readonly DeleteSharesAction $deleteShares,
        private readonly FileStore $files,
    ) {}

    public function handle(User $user): void
    {
        DB::transaction(function () use ($user): void {
            $this->deleteShares->handle($user, $user->shares()->get());
            if ($user->avatar_path !== null && $this->files->exists($user->avatar_path)) {
                $this->files->delete($user->avatar_path);
            }
            $user->delete();
        });
    }
}
