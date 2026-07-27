<?php

namespace App\Enums;

enum LeadStatus: string
{
    case New = 'new';
    case Contacted = 'contacted';
    case Qualified = 'qualified';
    case AssessmentScheduled = 'assessment_scheduled';
    case TrialScheduled = 'trial_scheduled';
    case Won = 'won';
    case Lost = 'lost';

    public function label(): string
    {
        return match ($this) {
            self::New => 'جديد',
            self::Contacted => 'تم التواصل',
            self::Qualified => 'مؤهل',
            self::AssessmentScheduled => 'اختبار مستوى',
            self::TrialScheduled => 'حصة تجريبية',
            self::Won => 'تم التسجيل',
            self::Lost => 'غير مهتم',
        };
    }
}
