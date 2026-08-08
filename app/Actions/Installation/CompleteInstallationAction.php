<?php

namespace App\Actions\Installation;

use App\Actions\Admin\UpdateInstallationSettingAction;
use App\Models\InstallationSetting;
use App\Services\InstallationState;
use Illuminate\Support\Facades\Artisan;
use Throwable;

final class CompleteInstallationAction
{
    public function __construct(
        private InstallationState $state,
        private UpdateInstallationSettingAction $updateSettings,
    ) {}

    /** @param array<string, mixed> $data */
    public function handle(array $data): InstallationSetting
    {
        $settings = $this->updateSettings->handle(InstallationSetting::current(), $data);

        $this->linkPublicStorage();

        $settings->markInstalled();
        $this->state->refresh();

        return $settings;
    }

    /**
     * Avatars are served from the public disk, which is useless without the
     * symlink. A first run is the only moment nobody has made one yet.
     */
    private function linkPublicStorage(): void
    {
        if (file_exists(public_path('storage'))) {
            return;
        }

        try {
            Artisan::call('storage:link');
        } catch (Throwable) {
            // A read-only public/ is a deployment choice, not a reason to
            // refuse to finish installing.
        }
    }
}
