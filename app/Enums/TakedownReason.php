<?php

namespace App\Enums;

/** Why someone asks for a share to be taken down. */
enum TakedownReason: string
{
    case Copyright = 'copyright';
    case Illegal = 'illegal';
    case Privacy = 'privacy';
    case Malware = 'malware';
    case Abuse = 'abuse';
    case Other = 'other';
}
