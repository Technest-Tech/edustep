<?php

namespace App\Enums;

enum TrialBookingStatus: string
{
    case Scheduled = 'scheduled';
    case Confirmed = 'confirmed';
    case Attended = 'attended';
    case NoShow = 'no_show';
    case Cancelled = 'cancelled';
}
