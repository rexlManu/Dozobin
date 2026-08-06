<?php

namespace App\Policies;

use App\Models\InstallationSetting;
use App\Models\User;

final class InstallationSettingPolicy
{
    public function update(User $user, InstallationSetting $setting): bool
    {
        return $user->isAdmin();
    }
}
