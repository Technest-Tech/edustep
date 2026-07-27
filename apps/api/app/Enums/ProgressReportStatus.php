<?php

namespace App\Enums;

enum ProgressReportStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Archived = 'archived';
}
