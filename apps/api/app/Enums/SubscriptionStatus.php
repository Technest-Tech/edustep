<?php

namespace App\Enums;

enum SubscriptionStatus: string
{
    case Scheduled = 'scheduled';
    case Active = 'active';
    case Frozen = 'frozen';
    case Expiring = 'expiring';
    case Renewed = 'renewed';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
