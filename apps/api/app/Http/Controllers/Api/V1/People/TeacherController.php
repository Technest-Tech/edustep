<?php

namespace App\Http\Controllers\Api\V1\People;

use App\Enums\TeacherRateType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\People\StoreTeacherRequest;
use App\Http\Requests\Api\V1\People\SyncTeacherCohortsRequest;
use App\Http\Requests\Api\V1\People\UpdateTeacherRequest;
use App\Http\Resources\Api\V1\People\TeacherResource;
use App\Models\Cohort;
use App\Models\TeacherRateRule;
use App\Models\User;
use App\Modules\Academics\Actions\EnsureSessionAvailability;
use App\Modules\Management\Actions\RecordAuditLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TeacherController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = User::query()
            ->where('role', 'teacher')
            ->with($this->baseRelations())
            ->withCount([
                'teachingCohorts' => fn ($query) => $query->whereIn('status', ['active', 'enrolling']),
            ])
            ->when(
                $request->string('search')->toString(),
                fn (Builder $query, string $search) => $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhereHas(
                            'teacherProfile',
                            fn (Builder $query) => $query
                                ->where('specialization', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%"),
                        );
                }),
            )
            ->when(
                $request->string('status')->toString(),
                fn (Builder $query, string $status) => $query->where('status', $status),
            )
            ->orderByRaw("case when status = 'active' then 0 else 1 end")
            ->orderBy('name');

        return TeacherResource::collection($query->get());
    }

    public function store(
        StoreTeacherRequest $request,
        RecordAuditLog $audit,
    ): JsonResponse {
        $data = $request->validated();
        $teacher = DB::transaction(function () use ($data, $request): User {
            $teacher = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'job_title' => $data['specialization'] ?? 'English Teacher',
                'password' => $data['password'],
                'locale' => 'ar',
                'timezone' => $request->user()->timezone ?: 'Africa/Cairo',
                'role' => 'teacher',
                'status' => $data['status'] ?? 'active',
                'email_verified_at' => now(),
            ]);
            $teacher->forceFill([
                'must_change_password' => false,
                'password_changed_at' => now(),
            ])->save();
            $teacher->teacherProfile()->create([
                'phone' => $data['phone'] ?? null,
                'employment_type' => $data['employment_type'],
                'specialization' => $data['specialization'] ?? null,
                'hourly_rate' => $data['rate_type'] === TeacherRateType::Hourly->value
                    ? $data['rate_amount']
                    : 0,
                'availability' => $data['availability'] ?? [],
                'bio' => $data['bio'] ?? null,
            ]);
            $teacher->teacherRateRules()->create([
                'program_id' => null,
                'rate_type' => $data['rate_type'],
                'amount' => $data['rate_amount'],
                'effective_from' => today(),
                'effective_to' => null,
                'is_active' => true,
                'notes' => 'قاعدة السعر الأساسية من ملف المعلم.',
            ]);

            return $teacher;
        });

        $audit->handle(
            $request,
            'teacher.created',
            'people',
            "تم إنشاء ملف وحساب المعلم {$teacher->name}.",
            $teacher,
            null,
            [
                'name' => $teacher->name,
                'email' => $teacher->email,
                'phone' => $data['phone'] ?? null,
                'employment_type' => $data['employment_type'],
                'specialization' => $data['specialization'] ?? null,
                'rate_type' => $data['rate_type'],
                'rate_amount' => (string) $data['rate_amount'],
                'availability' => $data['availability'] ?? [],
                'status' => $teacher->status,
            ],
            [...array_keys(Arr::except($data, ['password_confirmation'])), 'role'],
        );

        return (new TeacherResource($this->loadTeacher($teacher)))
            ->response()
            ->setStatusCode(201);
    }

    public function show(User $teacher): TeacherResource
    {
        $this->ensureTeacher($teacher);

        return new TeacherResource($this->loadTeacher($teacher, detailed: true));
    }

    public function update(
        UpdateTeacherRequest $request,
        User $teacher,
        RecordAuditLog $audit,
    ): TeacherResource {
        $this->ensureTeacher($teacher);
        $data = $request->validated();

        if (
            ($data['status'] ?? null) === 'suspended'
            && $teacher->status !== 'suspended'
            && $teacher->teachingCohorts()
                ->whereIn('status', ['active', 'enrolling'])
                ->exists()
        ) {
            throw ValidationException::withMessages([
                'status' => ['انقل الجروبات النشطة إلى معلم آخر قبل إيقاف هذا الحساب.'],
            ]);
        }

        $oldValues = $this->teacherSnapshot($this->loadTeacher($teacher));
        $passwordChanged = filled($data['password'] ?? null);

        DB::transaction(function () use ($teacher, $data, $passwordChanged): void {
            $teacher->update(Arr::only($data, ['name', 'email', 'phone', 'status']));
            if (array_key_exists('specialization', $data)) {
                $teacher->update(['job_title' => $data['specialization']]);
            }

            $teacher->teacherProfile()->updateOrCreate(
                ['user_id' => $teacher->id],
                Arr::only($data, [
                    'phone',
                    'employment_type',
                    'specialization',
                    'availability',
                    'bio',
                ]),
            );

            if (array_key_exists('rate_type', $data) && array_key_exists('rate_amount', $data)) {
                $this->syncRateRule($teacher, $data['rate_type'], (float) $data['rate_amount']);
            }

            if ($passwordChanged) {
                $teacher->forceFill([
                    'password' => $data['password'],
                    'must_change_password' => false,
                    'password_changed_at' => now(),
                ])->save();
                $this->revokeUserSessions($teacher);
            }

            if (($data['status'] ?? null) === 'suspended') {
                $this->revokeUserSessions($teacher);
            }
        });

        $teacher = $this->loadTeacher($teacher->fresh());
        $newValues = $this->teacherSnapshot($teacher);
        $changedFields = array_keys(Arr::except($data, ['password_confirmation']));

        $audit->handle(
            $request,
            'teacher.updated',
            'people',
            "تم تحديث ملف المعلم {$teacher->name}.",
            $teacher,
            $oldValues,
            $newValues,
            $changedFields,
        );

        return new TeacherResource($teacher);
    }

    public function syncCohorts(
        SyncTeacherCohortsRequest $request,
        User $teacher,
        EnsureSessionAvailability $ensureAvailability,
        RecordAuditLog $audit,
    ): TeacherResource {
        $this->ensureTeacher($teacher);
        $data = $request->validated();
        $targetIds = collect($data['cohort_ids']);
        $updateFutureSessions = (bool) ($data['update_future_sessions'] ?? true);

        if ($teacher->status !== 'active' && $targetIds->isNotEmpty()) {
            throw ValidationException::withMessages([
                'teacher' => ['فعّل حساب المعلم قبل إسناد جروبات إليه.'],
            ]);
        }

        $oldAssignments = Cohort::query()
            ->where('teacher_id', $teacher->id)
            ->whereIn('status', ['planned', 'enrolling', 'active'])
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(fn (Cohort $cohort) => $cohort->only(['id', 'name', 'code']))
            ->values()
            ->all();

        DB::transaction(function () use (
            $teacher,
            $targetIds,
            $updateFutureSessions,
            $ensureAvailability,
        ): void {
            $cohorts = Cohort::query()
                ->whereIn('status', ['planned', 'enrolling', 'active'])
                ->where(function (Builder $query) use ($teacher, $targetIds): void {
                    $query
                        ->where('teacher_id', $teacher->id)
                        ->when(
                            $targetIds->isNotEmpty(),
                            fn (Builder $query) => $query->orWhereIn('id', $targetIds->all()),
                        );
                })
                ->lockForUpdate()
                ->get();

            foreach ($cohorts as $cohort) {
                $shouldBelongToTeacher = $targetIds->contains($cohort->id);
                $teacherId = $shouldBelongToTeacher ? $teacher->id : null;

                if ($cohort->teacher_id === $teacherId) {
                    if ($updateFutureSessions && $shouldBelongToTeacher) {
                        $this->updateFutureSessionsTeacher(
                            $cohort,
                            $teacherId,
                            $ensureAvailability,
                        );
                    }
                    continue;
                }

                if ($updateFutureSessions) {
                    $this->updateFutureSessionsTeacher(
                        $cohort,
                        $teacherId,
                        $ensureAvailability,
                    );
                }

                $cohort->update(['teacher_id' => $teacherId]);
            }
        });

        $newAssignments = Cohort::query()
            ->where('teacher_id', $teacher->id)
            ->whereIn('status', ['planned', 'enrolling', 'active'])
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(fn (Cohort $cohort) => $cohort->only(['id', 'name', 'code']))
            ->values()
            ->all();

        $audit->handle(
            $request,
            'teacher.cohorts_synced',
            'academics',
            "تم تحديث الجروبات المسندة إلى المعلم {$teacher->name}.",
            $teacher,
            ['cohorts' => $oldAssignments],
            ['cohorts' => $newAssignments],
            ['cohort_ids', 'update_future_sessions'],
            ['future_sessions_updated' => $updateFutureSessions],
        );

        return new TeacherResource($this->loadTeacher($teacher->fresh(), detailed: true));
    }

    /**
     * @return array<string, mixed>
     */
    private function baseRelations(): array
    {
        return [
            'teacherProfile',
            'teacherRateRules' => fn ($query) => $query
                ->whereNull('program_id')
                ->where('is_active', true)
                ->whereDate('effective_from', '<=', today())
                ->where(function ($query): void {
                    $query->whereNull('effective_to')->orWhereDate('effective_to', '>=', today());
                })
                ->latest('effective_from'),
            'teachingCohorts' => fn ($query) => $query
                ->with(['program', 'level', 'enrollments'])
                ->latest('starts_on'),
        ];
    }

    private function loadTeacher(User $teacher, bool $detailed = false): User
    {
        $relations = $this->baseRelations();
        if ($detailed) {
            $relations = [
                ...$relations,
                'teachingSessions' => fn ($query) => $query
                    ->with(['cohort:id,name,code'])
                    ->latest('starts_at')
                    ->limit(20),
                'teacherEarnings' => fn ($query) => $query
                    ->with('classSession.cohort:id,name,code')
                    ->latest('earned_on')
                    ->limit(20),
            ];
        }

        return $teacher
            ->load($relations)
            ->loadCount([
                'teachingCohorts' => fn ($query) => $query->whereIn('status', ['active', 'enrolling']),
            ]);
    }

    private function ensureTeacher(User $teacher): void
    {
        abort_unless($teacher->role === 'teacher', 404);
    }

    private function syncRateRule(User $teacher, string $rateType, float $rateAmount): void
    {
        $currentRule = TeacherRateRule::query()
            ->where('teacher_id', $teacher->id)
            ->whereNull('program_id')
            ->where('is_active', true)
            ->whereNull('effective_to')
            ->latest('effective_from')
            ->first();

        if ($currentRule?->effective_from->isToday()) {
            $currentRule->update([
                'rate_type' => $rateType,
                'amount' => $rateAmount,
            ]);
        } else {
            $currentRule?->update([
                'effective_to' => today()->subDay(),
                'is_active' => false,
            ]);
            $teacher->teacherRateRules()->create([
                'program_id' => null,
                'rate_type' => $rateType,
                'amount' => $rateAmount,
                'effective_from' => today(),
                'effective_to' => null,
                'is_active' => true,
                'notes' => 'قاعدة السعر الأساسية من ملف المعلم.',
            ]);
        }

        if ($rateType === TeacherRateType::Hourly->value) {
            $teacher->teacherProfile()->update(['hourly_rate' => $rateAmount]);
        }
    }

    private function updateFutureSessionsTeacher(
        Cohort $cohort,
        ?string $teacherId,
        EnsureSessionAvailability $ensureAvailability,
    ): void {
        $sessions = $cohort->classSessions()
            ->where('status', 'scheduled')
            ->where('starts_at', '>=', now())
            ->orderBy('starts_at')
            ->lockForUpdate()
            ->get();

        foreach ($sessions as $session) {
            if ($teacherId) {
                $ensureAvailability->execute(
                    $teacherId,
                    $session->room_name,
                    $session->starts_at,
                    $session->ends_at,
                    $session->id,
                );
            }

            $session->update(['teacher_id' => $teacherId]);
        }
    }

    private function revokeUserSessions(User $teacher): void
    {
        DB::table('sessions')->where('user_id', $teacher->id)->delete();
        $teacher->tokens()->delete();
    }

    /**
     * @return array<string, mixed>
     */
    private function teacherSnapshot(User $teacher): array
    {
        $profile = $teacher->teacherProfile;
        $rate = $teacher->teacherRateRules->first();

        return [
            'name' => $teacher->name,
            'email' => $teacher->email,
            'status' => $teacher->status,
            'phone' => $profile?->phone,
            'employment_type' => $profile?->employment_type,
            'specialization' => $profile?->specialization,
            'availability' => $profile?->availability,
            'bio' => $profile?->bio,
            'rate_type' => $rate?->rate_type?->value,
            'rate_amount' => $rate?->amount,
        ];
    }
}
