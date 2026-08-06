<?php

namespace App\Data;

use App\Enums\Expiration;
use App\Enums\PasteType;

final readonly class CreatePasteData
{
    public function __construct(
        public string $body,
        public PasteType $pasteType,
        public ?string $language,
        public Expiration $expiration,
        public ?string $password,
    ) {}
}
