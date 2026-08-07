<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\UpdateInstallationSettingAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateInstallationSettingRequest;
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
}
