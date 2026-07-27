<?php

namespace App\Http\Controllers\Api\V1\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Management\StoreTeamMemberRequest;
use App\Http\Requests\Api\V1\Management\UpdateAcademySettingsRequest;
use App\Http\Requests\Api\V1\Management\UpdateTeamMemberPasswordRequest;
use App\Http\Requests\Api\V1\Management\UpdateTeamMemberRequest;
use App\Http\Resources\Api\V1\Management\AcademySettingResource;
use App\Http\Resources\Api\V1\Management\AuditLogResource;
use App\Http\Resources\Api\V1\Management\TeamMemberResource;
use App\Models\AcademySetting;
use App\Models\AuditLog;
use App\Models\User;
use App\Modules\Management\Actions\RecordAuditLog;
use App\Support\RoleCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ManagementCenterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $settings = $this->settings();
        $team = User::query()
            ->withCount([
                'teachingCohorts' => fn ($query) => $query->whereIn('status', ['active', 'enrolling']),
                'auditLogs',
            ])
            ->orderByRaw("case when role = 'owner' then 0 when status = 'active' then 1 else 2 end")
            ->orderBy('name')
            ->get();
        $auditLogs = AuditLog::query()
            ->with('actor:id,name,role')
            ->when(
                $request->string('category')->toString(),
                fn ($query, string $category) => $query->where('category', $category),
            )
            ->latest('created_at')
            ->limit(100)
            ->get();

        return response()->json([
            'data' => [
                'summary' => [
                    'active_users' => $team->where('status', 'active')->count(),
                    'staff_accounts' => $team
                        ->whereIn('role', RoleCatalog::staffKeys())
                        ->count(),
                    'portal_accounts' => $team
                        ->whereIn('role', ['teacher', 'guardian'])
                        ->count(),
                    'suspended_users' => $team->where('status', 'suspended')->count(),
                    'audit_today' => AuditLog::query()
                        ->where('created_at', '>=', today())
                        ->count(),
                ],
                'settings' => (new AcademySettingResource(
                    $settings->load('updater:id,name'),
                ))->resolve($request),
                'roles' => collect(RoleCatalog::all())
                    ->map(fn (array $role, string $key) => ['key' => $key, ...$role])
                    ->values()
                    ->all(),
                'team' => TeamMemberResource::collection($team)->resolve($request),
                'audit_logs' => AuditLogResource::collection($auditLogs)->resolve($request),
            ],
        ]);
    }

    public function updateSettings(
        UpdateAcademySettingsRequest $request,
        RecordAuditLog $audit,
    ): AcademySettingResource {
        $settings = $this->settings();
        $data = $request->validated();
        $oldValues = $settings->only(array_keys($data));
        $settings->update([
            ...$data,
            'updated_by' => $request->user()->id,
        ]);
        $newValues = $settings->fresh()->only(array_keys($data));

        $audit->handle(
            $request,
            'settings.updated',
            'settings',
            'تم تحديث إعدادات الأكاديمية وقواعد التشغيل الافتراضية.',
            $settings,
            $oldValues,
            $newValues,
            array_keys($data),
        );

        return new AcademySettingResource($settings->fresh()->load('updater:id,name'));
    }

    public function storeTeamMember(
        StoreTeamMemberRequest $request,
        RecordAuditLog $audit,
    ): TeamMemberResource {
        $data = $request->safe()->except(['password_confirmation']);
        $user = User::query()->create([
            ...$data,
            'status' => $data['status'] ?? 'active',
            'locale' => 'ar',
            'timezone' => $this->settings()->timezone,
            'email_verified_at' => now(),
        ]);
        $user->forceFill(['must_change_password' => true])->save();

        $audit->handle(
            $request,
            'team.user_created',
            'security',
            "تم إنشاء حساب {$user->name} بدور ".RoleCatalog::all()[$user->role]['label'].'.',
            $user,
            null,
            $user->only(['name', 'email', 'phone', 'job_title', 'role', 'status']),
            ['name', 'email', 'phone', 'job_title', 'role', 'status', 'password'],
        );

        return new TeamMemberResource(
            $user->loadCount(['teachingCohorts', 'auditLogs']),
        );
    }

    public function updateTeamMember(
        UpdateTeamMemberRequest $request,
        User $user,
        RecordAuditLog $audit,
    ): TeamMemberResource {
        $data = $request->validated();
        $this->validateTeamChange($request, $user, $data);
        $oldValues = $user->only(array_keys($data));
        $user->update($data);

        if (($data['status'] ?? null) === 'suspended') {
            $this->revokeUserSessions($user);
        }

        $newValues = $user->fresh()->only(array_keys($data));
        $audit->handle(
            $request,
            'team.user_updated',
            'security',
            "تم تحديث حساب {$user->name}.",
            $user,
            $oldValues,
            $newValues,
            array_keys($data),
        );

        return new TeamMemberResource(
            $user->fresh()->loadCount(['teachingCohorts', 'auditLogs']),
        );
    }

    public function updatePassword(
        UpdateTeamMemberPasswordRequest $request,
        User $user,
        RecordAuditLog $audit,
    ): JsonResponse {
        if ($request->user()->is($user)) {
            throw ValidationException::withMessages([
                'user' => ['استخدم إعدادات حسابك الشخصية لتغيير كلمة مرورك.'],
            ]);
        }

        $user->forceFill([
            'password' => $request->validated('password'),
            'must_change_password' => true,
            'password_changed_at' => null,
        ])->save();
        $this->revokeUserSessions($user);
        $audit->handle(
            $request,
            'team.password_reset',
            'security',
            "تم تعيين كلمة مرور جديدة لحساب {$user->name} وإغلاق جلساته المفتوحة.",
            $user,
            null,
            null,
            ['password', 'must_change_password'],
        );

        return response()->json([
            'data' => [
                'message' => 'تم تحديث كلمة المرور وإغلاق الجلسات المفتوحة للحساب.',
            ],
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function validateTeamChange(Request $request, User $user, array $data): void
    {
        $roleChanges = isset($data['role']) && $data['role'] !== $user->role;
        $statusChanges = isset($data['status']) && $data['status'] !== $user->status;

        if ($request->user()->is($user) && ($roleChanges || $statusChanges)) {
            throw ValidationException::withMessages([
                'user' => ['لا يمكنك تغيير دور حسابك الحالي أو تعطيله من هذه الشاشة.'],
            ]);
        }

        if ($roleChanges && ($user->teacherProfile()->exists() || $user->guardianProfile()->exists())) {
            throw ValidationException::withMessages([
                'role' => ['لا يمكن تغيير دور حساب مرتبط بملف معلم أو ولي أمر.'],
            ]);
        }

        $removesActiveOwner = $user->role === 'owner'
            && $user->status === 'active'
            && (
                ($data['role'] ?? $user->role) !== 'owner'
                || ($data['status'] ?? $user->status) !== 'active'
            );

        if ($removesActiveOwner
            && ! User::query()
                ->whereKeyNot($user->id)
                ->where('role', 'owner')
                ->where('status', 'active')
                ->exists()) {
            throw ValidationException::withMessages([
                'role' => ['يجب أن يظل هناك مدير أكاديمية نشط واحد على الأقل.'],
            ]);
        }
    }

    private function revokeUserSessions(User $user): void
    {
        DB::table('sessions')->where('user_id', $user->id)->delete();
        $user->tokens()->delete();
    }

    private function settings(): AcademySetting
    {
        return AcademySetting::query()->firstOrCreate([], [
            'academy_name' => 'EduStep English Academy',
            'academy_name_en' => 'EduStep English Academy',
            'phone' => '01000000000',
            'whatsapp_phone' => '01000000000',
            'email' => 'hello@edustep.local',
            'timezone' => 'Africa/Cairo',
            'locale' => 'ar',
            'currency' => 'EGP',
            'invoice_prefix' => 'INV',
            'student_code_prefix' => 'ES',
            'offer_validity_days' => 7,
            'seat_hold_hours' => 48,
            'working_days' => ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
            'business_hours' => ['start' => '09:00', 'end' => '21:00'],
        ]);
    }
}
