<?php

namespace App\Enums;

enum ShareState: string
{
    case Ready = 'ready';
    case Blocked = 'blocked';
    case Unavailable = 'unavailable';
}
