<?php

namespace App\Enums;

enum UserRole: string
{
    case Member = 'member';
    case Admin = 'admin';
}
