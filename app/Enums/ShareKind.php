<?php

namespace App\Enums;

enum ShareKind: string
{
    case File = 'file';
    case Paste = 'paste';
}
