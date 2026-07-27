<?php

namespace App\Enums;

enum TeacherEarningStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Paid = 'paid';
    case Void = 'void';
}
