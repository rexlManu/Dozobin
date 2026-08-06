<?php

namespace App\Enums;

enum ShareState: string
{
    case Ready = 'ready';
    case Unavailable = 'unavailable';
}
