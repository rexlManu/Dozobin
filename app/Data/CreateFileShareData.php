<?php

namespace App\Data;

use App\Enums\Expiration;
use Illuminate\Http\UploadedFile;

final readonly class CreateFileShareData
{
    public function __construct(
        public UploadedFile $file,
        public Expiration $expiration,
        public ?string $password,
    ) {}
}
