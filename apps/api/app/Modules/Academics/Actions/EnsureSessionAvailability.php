<?php

namespace App\Modules\Academics\Actions;

use App\Models\ClassSession;
use Carbon\CarbonInterface;
use Illuminate\Validation\ValidationException;

class EnsureSessionAvailability
{
    public function execute(
        ?string $teacherId,
        ?string $roomName,
        CarbonInterface $startsAt,
        CarbonInterface $endsAt,
        ?string $exceptSessionId = null,
    ): void {
        $roomName = $roomName ? trim($roomName) : null;

        if (! $teacherId && ! $roomName) {
            return;
        }

        $conflict = ClassSession::query()
            ->with(['teacher:id,name', 'cohort:id,name'])
            ->where('status', '!=', 'cancelled')
            ->when($exceptSessionId, fn ($query) => $query->whereKeyNot($exceptSessionId))
            ->where('starts_at', '<', $endsAt)
            ->where('ends_at', '>', $startsAt)
            ->where(function ($query) use ($teacherId, $roomName): void {
                if ($teacherId) {
                    $query->where('teacher_id', $teacherId);
                }

                if ($roomName) {
                    $method = $teacherId ? 'orWhere' : 'where';
                    $query->{$method}('room_name', $roomName);
                }
            })
            ->first();

        if (! $conflict) {
            return;
        }

        $reason = $teacherId && $conflict->teacher_id === $teacherId
            ? "المعلم {$conflict->teacher?->name} لديه حصة متداخلة"
            : "القاعة {$roomName} مستخدمة في حصة أخرى";

        throw ValidationException::withMessages([
            'starts_at' => "{$reason}: {$conflict->cohort?->name} من "
                .$conflict->starts_at->format('H:i').' إلى '.$conflict->ends_at->format('H:i').'.',
        ]);
    }
}
