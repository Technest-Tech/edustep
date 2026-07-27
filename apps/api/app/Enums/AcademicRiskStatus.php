<?php

namespace App\Enums;

enum AcademicRiskStatus: string
{
    case Open = 'open';
    case Monitoring = 'monitoring';
    case Resolved = 'resolved';
}
