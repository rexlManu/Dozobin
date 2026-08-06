<?php

namespace App\Actions\Accounts;

use App\Actions\Shares\DeleteSharesAction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class DeleteAccountAction
{
    public function __construct(private DeleteSharesAction $deleteShares) {}

    public function handle(User $user): void
    {
        DB::transaction(function () use ($user): void {
            $this->deleteShares->handle($user, $user->shares()->get());
            $user->delete();
        });
    }
}
