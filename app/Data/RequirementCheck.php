<?php

namespace App\Data;

final readonly class RequirementCheck
{
    public function __construct(
        public string $label,
        public bool $satisfied,
        public string $detail,
    ) {}

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'label' => $this->label,
            'satisfied' => $this->satisfied,
            'detail' => $this->detail,
        ];
    }
}
