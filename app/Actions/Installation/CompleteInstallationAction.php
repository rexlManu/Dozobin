<?php

namespace App\Actions\Installation;

use App\Actions\Admin\UpdateInstallationSettingAction;
use App\Exceptions\FileStoreUnavailableException;
use App\Models\InstallationSetting;
use App\Services\FileStoreProbe;
use App\Services\InstallationState;

final class CompleteInstallationAction
{
    public function __construct(
        private InstallationState $state,
        private UpdateInstallationSettingAction $updateSettings,
        private FileStoreProbe $fileStoreProbe,
    ) {}

    /** @param array<string, mixed> $data */
    public function handle(array $data): InstallationSetting
    {
        if (! $this->fileStoreProbe->run()->satisfied) {
            throw new FileStoreUnavailableException('The File Store must pass its checks before installation can finish.');
        }

        $settings = $this->updateSettings->handle(InstallationSetting::current(), $data);

        $settings->markInstalled();
        $this->state->refresh();

        return $settings;
    }
}
