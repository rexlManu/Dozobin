<?php

namespace App\Enums;

enum PasteType: string
{
    case Text = 'text';
    case Markdown = 'markdown';
    case Code = 'code';
}
