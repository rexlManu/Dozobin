<?php

namespace App\Enums;

enum RegistrationMode: string
{
    case Open = 'open';
    case Invite = 'invite';
    case Closed = 'closed';
}
