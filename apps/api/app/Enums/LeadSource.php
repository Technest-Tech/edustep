<?php

namespace App\Enums;

enum LeadSource: string
{
    case WhatsApp = 'whatsapp';
    case Facebook = 'facebook';
    case Instagram = 'instagram';
    case Referral = 'referral';
    case Website = 'website';
    case WalkIn = 'walk_in';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::WhatsApp => 'WhatsApp',
            self::Facebook => 'Facebook',
            self::Instagram => 'Instagram',
            self::Referral => 'ترشيح',
            self::Website => 'الموقع',
            self::WalkIn => 'زيارة الفرع',
            self::Other => 'أخرى',
        };
    }
}
