<?php

namespace App\Enums;

enum TransferItemKind: string
{
    case File = 'file';
    case Image = 'image';
    case Text = 'text';
}
