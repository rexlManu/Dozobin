<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\UpdateInstallationSettingAction;
use App\Actions\Admin\UpdateTrackingCodeAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateInstallationSettingRequest;
use App\Http\Requests\UpdateTrackingCodeRequest;
use App\Models\InstallationSetting;
use Illuminate\Http\RedirectResponse;

final class InstallationSettingController extends Controller
{
    public function update(UpdateInstallationSettingRequest $request, UpdateInstallationSettingAction $update): RedirectResponse
    {
        $update->handle(
            InstallationSetting::current(),
            $request->validated(),
        );

        return back()->with('status', 'Installation settings updated.');
    }

    public function updateTrackingCode(UpdateTrackingCodeRequest $request, UpdateTrackingCodeAction $update): RedirectResponse
    {
        $update->handle(
            InstallationSetting::current(),
            $request->validated('trackingCode'),
        );

        return back()->with('status', 'Tracking code updated.');
    }
}
