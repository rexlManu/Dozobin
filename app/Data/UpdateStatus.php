<?php

namespace App\Data;

final readonly class UpdateStatus
{
    public function __construct(
        public string $currentVersion,
        public ?string $currentCommit,
        public ?string $builtAt,
        public ?string $latestVersion,
        public ?string $releaseUrl,
        public ?int $checkedAt,
        public bool $checksEnabled,
        public bool $updateAvailable,
        public bool $dismissed,
    ) {}

    /** @return array<string, bool|int|string|null> */
    public function toArray(): array
    {
        return [
            'currentVersion' => $this->currentVersion,
            'currentCommit' => $this->currentCommit,
            'builtAt' => $this->builtAt,
            'latestVersion' => $this->latestVersion,
            'releaseUrl' => $this->releaseUrl,
            'checkedAt' => $this->checkedAt,
            'checksEnabled' => $this->checksEnabled,
            'updateAvailable' => $this->updateAvailable,
            'dismissed' => $this->dismissed,
        ];
    }
}
