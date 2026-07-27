<?php

namespace App\Modules\Academics\Actions;

use App\Enums\ClassSessionStatus;
use App\Models\AcademyClosure;
use App\Models\ClassSession;
use App\Models\Cohort;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Validation\ValidationException;

class GenerateCohortSchedule
{
    public function __construct(
        private readonly EnsureSessionAvailability $ensureAvailability,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    public function execute(Cohort $cohort, array $attributes): array
    {
        if (! $cohort->teacher_id) {
            throw ValidationException::withMessages([
                'cohort' => ['يجب تعيين معلم للجروب قبل توليد الحصص.'],
            ]);
        }

        if (empty($cohort->schedule)) {
            throw ValidationException::withMessages([
                'schedule' => ['لا يوجد جدول أسبوعي محفوظ لهذا الجروب.'],
            ]);
        }

        $from = Carbon::parse($attributes['from'])->startOfDay();
        $to = Carbon::parse($attributes['to'])->endOfDay();

        if ($from->diffInDays($to) > 120) {
            throw ValidationException::withMessages([
                'to' => ['يمكن توليد 121 يومًا كحد أقصى في العملية الواحدة.'],
            ]);
        }

        $dayNumbers = [
            'monday' => 1,
            'tuesday' => 2,
            'wednesday' => 3,
            'thursday' => 4,
            'friday' => 5,
            'saturday' => 6,
            'sunday' => 7,
        ];
        $scheduleByDay = collect($cohort->schedule)
            ->filter(fn ($slot) => isset($dayNumbers[strtolower($slot['day'] ?? '')], $slot['time']))
            ->groupBy(fn ($slot) => $dayNumbers[strtolower($slot['day'])]);
        $nextNumber = $cohort->classSessions()->count() + 1;
        $created = collect();
        $skippedDuplicates = 0;
        $skippedClosures = collect();
        $conflicts = collect();

        foreach (CarbonPeriod::create($from, $to) as $date) {
            $slots = $scheduleByDay->get($date->dayOfWeekIso, collect());

            foreach ($slots as $slot) {
                $closure = AcademyClosure::query()
                    ->whereDate('starts_on', '<=', $date)
                    ->whereDate('ends_on', '>=', $date)
                    ->when(
                        $cohort->delivery_mode === 'online',
                        fn ($query) => $query->where('affects_online', true),
                    )
                    ->first();

                if ($closure) {
                    $skippedClosures->push([
                        'date' => $date->toDateString(),
                        'name' => $closure->name,
                    ]);

                    continue;
                }

                $startsAt = Carbon::parse(
                    $date->toDateString().' '.$slot['time'],
                    $cohort->timezone,
                )->utc();
                $endsAt = $startsAt->copy()->addMinutes((int) $attributes['duration_minutes']);

                if (ClassSession::query()
                    ->where('cohort_id', $cohort->id)
                    ->where('starts_at', $startsAt)
                    ->exists()) {
                    $skippedDuplicates++;

                    continue;
                }

                try {
                    $this->ensureAvailability->execute(
                        $cohort->teacher_id,
                        $cohort->room_name,
                        $startsAt,
                        $endsAt,
                    );
                } catch (ValidationException $exception) {
                    $conflicts->push([
                        'starts_at' => $startsAt->toIso8601String(),
                        'message' => collect($exception->errors())->flatten()->first(),
                    ]);

                    continue;
                }

                $title = trim(($attributes['title_prefix'] ?? 'الحصة').' '.$nextNumber);
                $session = $cohort->classSessions()->create([
                    'teacher_id' => $cohort->teacher_id,
                    'title' => $title,
                    'status' => ClassSessionStatus::Scheduled,
                    'starts_at' => $startsAt,
                    'ends_at' => $endsAt,
                    'meeting_url' => $cohort->meeting_url,
                    'room_name' => $cohort->room_name,
                    'lesson_focus' => $attributes['lesson_focus'] ?? null,
                ]);
                $created->push($session);
                $nextNumber++;
            }
        }

        return [
            'created' => $created,
            'summary' => [
                'created' => $created->count(),
                'skipped_duplicates' => $skippedDuplicates,
                'skipped_closures' => $skippedClosures->count(),
                'conflicts' => $conflicts->count(),
            ],
            'closures' => $skippedClosures->unique(fn ($item) => $item['date'].'-'.$item['name'])->values(),
            'conflicts' => $conflicts,
        ];
    }
}
