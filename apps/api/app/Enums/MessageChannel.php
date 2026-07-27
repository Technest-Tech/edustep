<?php

namespace App\Enums;

enum MessageChannel: string
{
    case Internal = 'internal';
    case WhatsApp = 'whatsapp';
    case Email = 'email';
    case Sms = 'sms';
}
