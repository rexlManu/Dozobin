<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\DismissUpdateNoticeRequest;
use App\Services\UpdateChecker;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

final class UpdateNoticeController extends Controller
{
    public function store(DismissUpdateNoticeRequest $request, UpdateChecker $updates): RedirectResponse
    {
        $administrator = $request->user();
        $status = $updates->status($administrator);
        $version = $request->string('version')->toString();

        if (! $status->updateAvailable || $status->latestVersion !== $version) {
            throw ValidationException::withMessages([
                'version' => 'That release is no longer the available update.',
            ]);
        }

        $administrator->forceFill(['dismissed_update_version' => $version])->save();

        return back();
    }
}
