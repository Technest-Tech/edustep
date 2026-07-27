<?php

namespace App\Enums;

enum WaitlistStatus: string
{
    case Waiting = 'waiting';
    case Offered = 'offered';
    case Converted = 'converted';
    case Withdrawn = 'withdrawn';
    case Expired = 'expired';
}
