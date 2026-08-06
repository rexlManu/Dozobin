<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\UpdateInstallationSettingAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateInstallationSettingRequest;
use App\Http\Resources\InstallationSettingResource;
use App\Models\InstallationSetting;

final class InstallationSettingController extends Controller
{
    public function update(UpdateInstallationSettingRequest $request, UpdateInstallationSettingAction $update): InstallationSettingResource
    {
        return InstallationSettingResource::make($update->handle(
            InstallationSetting::current(),
            $request->validated(),
        ));
    }
}
