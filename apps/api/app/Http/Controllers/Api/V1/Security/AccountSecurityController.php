<?php

namespace App\Http\Controllers\Api\V1\Security;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Security\UpdateOwnPasswordRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Modules\Management\Actions\RecordAuditLog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class AccountSecurityController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => [
                'user' => (new UserResource($user))->resolve($request),
                'two_factor' => [
                    'enabled' => filled($user->two_factor_confirmed_at),
                    'confirmed_at' => $user->two_factor_confirmed_at?->toIso8601String(),
                    'recovery_codes_remaining' => count($user->two_factor_recovery_codes ?? []),
                    'required' => config('security.require_privileged_two_factor')
                        && in_array($user->role, config('security.privileged_roles'), true),
                ],
                'sessions' => $this->sessions($request),
            ],
        ]);
    }

    public function updatePassword(
        UpdateOwnPasswordRequest $request,
        RecordAuditLog $audit,
    ): UserResource {
        $user = $request->user();
        $user->forceFill([
            'password' => $request->validated('password'),
            'must_change_password' => false,
            'password_changed_at' => now(),
        ])->save();
        $this->revokeOtherSessions($request);
        $user->tokens()->delete();

        $audit->handle(
            $request,
            'security.password_changed',
            'security',
            "تم تغيير كلمة مرور حساب {$user->name} وإغلاق الجلسات الأخرى.",
            $user,
            null,
            null,
            ['password'],
        );

        return new UserResource($user->fresh());
    }

    public function destroySession(Request $request, string $session): JsonResponse
    {
        $row = $this->databaseSessions($request)
            ->first(fn (object $candidate) => hash_equals(
                $this->publicSessionId($candidate->id),
                $session,
            ));

        if (! $row) {
            abort(404);
        }

        if ($request->hasSession() && $row->id === $request->session()->getId()) {
            throw ValidationException::withMessages([
                'session' => ['استخدم تسجيل الخروج لإغلاق الجلسة الحالية.'],
            ]);
        }

        DB::table(config('session.table'))->where('id', $row->id)->delete();

        return response()->json([
            'data' => [
                'message' => 'تم إغلاق الجلسة المحددة.',
            ],
        ]);
    }

    public function destroyOtherSessions(Request $request): JsonResponse
    {
        $count = $this->revokeOtherSessions($request);

        return response()->json([
            'data' => [
                'message' => 'تم إغلاق كل الجلسات الأخرى.',
                'revoked_sessions' => $count,
            ],
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function sessions(Request $request): array
    {
        $currentId = $request->hasSession() ? $request->session()->getId() : null;
        $rows = $this->databaseSessions($request);

        if ($rows->isEmpty()) {
            return [[
                'id' => $this->publicSessionId(
                    $currentId ?? 'token:'.($request->user()->currentAccessToken()?->getKey() ?? 'current'),
                ),
                'current' => true,
                'ip_address' => $request->ip(),
                'device' => $this->deviceName((string) $request->userAgent()),
                'last_active_at' => now()->toIso8601String(),
            ]];
        }

        return $rows->map(fn (object $session) => [
            'id' => $this->publicSessionId($session->id),
            'current' => $session->id === $currentId,
            'ip_address' => $session->ip_address,
            'device' => $this->deviceName((string) $session->user_agent),
            'last_active_at' => Carbon::createFromTimestamp($session->last_activity)
                ->toIso8601String(),
        ])->values()->all();
    }

    private function databaseSessions(Request $request)
    {
        if (config('session.driver') !== 'database'
            || ! Schema::hasTable(config('session.table'))) {
            return collect();
        }

        return DB::table(config('session.table'))
            ->where('user_id', $request->user()->id)
            ->orderByDesc('last_activity')
            ->get();
    }

    private function revokeOtherSessions(Request $request): int
    {
        if (config('session.driver') !== 'database'
            || ! Schema::hasTable(config('session.table'))) {
            return 0;
        }

        $query = DB::table(config('session.table'))
            ->where('user_id', $request->user()->id);

        if ($request->hasSession()) {
            $query->where('id', '!=', $request->session()->getId());
        }

        return $query->delete();
    }

    private function publicSessionId(string $sessionId): string
    {
        return hash_hmac('sha256', $sessionId, (string) config('app.key'));
    }

    private function deviceName(string $userAgent): string
    {
        $device = preg_match('/Mobile|Android|iPhone|iPad/i', $userAgent)
            ? 'هاتف أو جهاز لوحي'
            : 'كمبيوتر';
        $browser = match (true) {
            str_contains($userAgent, 'Edg/') => 'Edge',
            str_contains($userAgent, 'Chrome/') => 'Chrome',
            str_contains($userAgent, 'Safari/') && ! str_contains($userAgent, 'Chrome/') => 'Safari',
            str_contains($userAgent, 'Firefox/') => 'Firefox',
            default => 'متصفح غير معروف',
        };

        return "{$device} · {$browser}";
    }
}
