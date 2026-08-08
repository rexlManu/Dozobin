<?php

namespace App\Exceptions;

use RuntimeException;
use Throwable;

final class FileStoreUnavailableException extends RuntimeException
{
    public static function causedBy(Throwable $exception): self
    {
        return new self('The File Store is temporarily unavailable.', previous: $exception);
    }
}
