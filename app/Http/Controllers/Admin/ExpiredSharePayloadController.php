<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Shares\DispatchExpiredSharePayloadCleanupAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\CleanupExpiredSharePayloadsRequest;
use Illuminate\Http\RedirectResponse;

final class ExpiredSharePayloadController extends Controller
{
    public function store(
        CleanupExpiredSharePayloadsRequest $request,
        DispatchExpiredSharePayloadCleanupAction $dispatch,
    ): RedirectResponse {
        $queued = $dispatch->handle();

        return back()->with('status', "Queued {$queued} expired Share payload cleanup job(s).");
    }
}
