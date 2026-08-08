<?php

namespace App\Enums;

enum InstallStep: string
{
    case Database = 'database';
    case Account = 'account';
    case Settings = 'settings';
    case Done = 'done';

    /** Position in the wizard, used to render the stepper. */
    public function position(): int
    {
        return match ($this) {
            self::Database => 1,
            self::Account => 2,
            self::Settings => 3,
            self::Done => 4,
        };
    }
}
