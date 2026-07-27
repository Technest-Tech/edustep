<?php

namespace App\Enums;

enum CohortStatus: string
{
    case Planned = 'planned';
    case Enrolling = 'enrolling';
    case Active = 'active';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
