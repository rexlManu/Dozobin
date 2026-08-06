<?php

namespace App\Enums;

use Carbon\CarbonImmutable;

enum Expiration: string
{
    case OneHour = '1h';
    case OneDay = '1d';
    case SevenDays = '7d';
    case ThirtyDays = '30d';
    case Never = 'never';

    public function expiresAt(): ?CarbonImmutable
    {
        return match ($this) {
            self::OneHour => now()->addHour(),
            self::OneDay => now()->addDay(),
            self::SevenDays => now()->addDays(7),
            self::ThirtyDays => now()->addDays(30),
            self::Never => null,
        };
    }
}
