<?php

namespace App\Enums;

enum StudentStatus: string
{
    case Active = 'active';
    case Paused = 'paused';
    case Graduated = 'graduated';
    case Inactive = 'inactive';
}
