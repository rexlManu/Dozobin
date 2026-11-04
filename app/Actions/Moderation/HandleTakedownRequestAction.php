<?php

namespace App\Actions\Moderation;

use App\Actions\Shares\DeleteSharesAction;
use App\Enums\TakedownStatus;
use App\Models\TakedownRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class HandleTakedownRequestAction
{
    public function __construct(private DeleteSharesAction $deleteShares) {}

    /**
     * Sets the outcome of a report. With `$removeShare` the reported share and
     * its payload are deleted first, and the report is marked resolved.
     */
    public function handle(User $admin, TakedownRequest $report, TakedownStatus $status, bool $removeShare = false): TakedownRequest
    {
        DB::transaction(function () use ($admin, $report, $status, $removeShare): void {
            if ($removeShare && $report->share !== null) {
                $this->deleteShares->handle($admin, collect([$report->share]));
                $status = TakedownStatus::Resolved;
                // The foreign key does this too; set it here so the model agrees at once.
                $report->share()->dissociate();
            }

            $open = $status === TakedownStatus::Open;

            $report->update([
                'status' => $status,
                'handled_by_user_id' => $open ? null : $admin->id,
                'handled_at' => $open ? null : now(),
            ]);
        });

        return $report->refresh();
    }
}
