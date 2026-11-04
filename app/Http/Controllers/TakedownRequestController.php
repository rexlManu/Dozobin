<?php

namespace App\Http\Controllers;

use App\Actions\Moderation\SubmitTakedownRequestAction;
use App\Enums\TakedownReason;
use App\Http\Requests\StoreTakedownRequestRequest;
use Illuminate\Http\RedirectResponse;

final class TakedownRequestController extends Controller
{
    public function store(StoreTakedownRequestRequest $request, SubmitTakedownRequestAction $submit): RedirectResponse
    {
        $submit->handle([
            'share_url' => $request->string('share_url')->toString(),
            'reason' => $request->enum('reason', TakedownReason::class) ?? TakedownReason::Other,
            'details' => $request->string('details')->toString(),
            'reporter_name' => $request->filled('reporter_name') ? $request->string('reporter_name')->toString() : null,
            'reporter_email' => $request->string('reporter_email')->toString(),
        ]);

        return back()->with('status', 'Thank you. The operator of this site will review your report.');
    }
}
