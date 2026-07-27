<?php

namespace App\Enums;

enum ProgressRating: string
{
    case NeedsImprovement = 'needs_improvement';
    case Developing = 'developing';
    case Good = 'good';
    case Excellent = 'excellent';
}
