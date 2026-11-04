<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Moderation\HandleTakedownRequestAction;
use App\Enums\TakedownStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateTakedownRequestRequest;
use App\Models\TakedownRequest;
use Illuminate\Http\RedirectResponse;

final class TakedownRequestController extends Controller
{
    public function update(UpdateTakedownRequestRequest $request, TakedownRequest $takedownRequest, HandleTakedownRequestAction $handle): RedirectResponse
    {
        $report = $handle->handle(
            $request->user(),
            $takedownRequest,
            $request->enum('status', TakedownStatus::class) ?? TakedownStatus::Open,
            $request->boolean('remove_share'),
        );

        return back()->with('status', match ($report->status) {
            TakedownStatus::Resolved => 'Report resolved.',
            TakedownStatus::Dismissed => 'Report dismissed.',
            TakedownStatus::Open => 'Report opened again.',
        });
    }
}
