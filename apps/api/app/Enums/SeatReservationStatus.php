<?php

namespace App\Enums;

enum SeatReservationStatus: string
{
    case Held = 'held';
    case Converted = 'converted';
    case Released = 'released';
    case Expired = 'expired';
}
