<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetAccountPassword extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly string $token)
    {
        $this->onQueue('notifications');
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim((string) config('app.url'), '/').'/reset-password?'.http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);
        $minutes = config('auth.passwords.'.config('auth.defaults.passwords').'.expire');

        return (new MailMessage)
            ->subject('إعادة تعيين كلمة مرور EduStep')
            ->greeting("مرحبًا {$notifiable->name}")
            ->line('وصلنا طلب لإعادة تعيين كلمة مرور حسابك في نظام الأكاديمية.')
            ->action('إعادة تعيين كلمة المرور', $url)
            ->line("تنتهي صلاحية الرابط خلال {$minutes} دقيقة.")
            ->line('إذا لم تطلب تغيير كلمة المرور، تجاهل هذه الرسالة ولا تشارك الرابط مع أي شخص.');
    }
}
