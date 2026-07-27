<?php

namespace App\Http\Controllers\Api\V1\Security;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Security\ConfirmTwoFactorRequest;
use App\Http\Requests\Api\V1\Security\StartTwoFactorSetupRequest;
use App\Http\Requests\Api\V1\Security\TwoFactorCodeRequest;
use App\Http\Requests\Api\V1\Security\VerifyTwoFactorActionRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use App\Modules\Management\Actions\RecordAuditLog;
use App\Modules\Security\Actions\TotpAuthenticator;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TwoFactorAuthenticationController extends Controller
{
    public function challenge(
        TwoFactorCodeRequest $request,
        TotpAuthenticator $totp,
        RecordAuditLog $audit,
    ): UserResource {
        $this->ensureSession($request);
        $pending = $request->session()->get('auth.two_factor');

        if (! is_array($pending)
            || blank($pending['user_id'] ?? null)
            || ($pending['expires_at'] ?? 0) < now()->getTimestamp()) {
            $request->session()->forget('auth.two_factor');

            throw ValidationException::withMessages([
                'code' => ['انتهت جلسة التحقق. سجّل الدخول مرة أخرى.'],
            ]);
        }

        $user = DB::transaction(function () use ($pending, $request, $totp): User {
            $user = User::query()->lockForUpdate()->findOrFail($pending['user_id']);

            if ($user->status !== 'active' || ! $this->verifyUserCode(
                $user,
                $request->validated('code'),
                $totp,
            )) {
                throw ValidationException::withMessages([
                    'code' => ['رمز التحقق أو الاسترداد غير صحيح.'],
                ]);
            }

            return $user;
        });

        Auth::guard('web')->login($user, (bool) ($pending['remember'] ?? false));
        $request->session()->forget('auth.two_factor');
        $request->session()->regenerate();
        $user->forceFill(['last_login_at' => now()])->save();

        $audit->handle(
            $request,
            'auth.two_factor_completed',
            'security',
            "تم تسجيل دخول {$user->name} بعد التحقق بخطوتين.",
            $user,
        );

        return new UserResource($user->fresh());
    }

    public function setup(
        StartTwoFactorSetupRequest $request,
        TotpAuthenticator $totp,
    ): JsonResponse {
        $this->ensureSession($request);

        if ($request->user()->two_factor_confirmed_at) {
            throw ValidationException::withMessages([
                'two_factor' => ['التحقق بخطوتين مفعّل بالفعل لهذا الحساب.'],
            ]);
        }

        $secret = $totp->generateSecret();
        $expiresAt = now()->addMinutes(
            config('security.two_factor.setup_lifetime_minutes'),
        );
        $request->session()->put('security.two_factor_setup', [
            'secret' => $secret,
            'expires_at' => $expiresAt->getTimestamp(),
        ]);

        return response()->json([
            'data' => [
                'secret' => $secret,
                'provisioning_uri' => $totp->provisioningUri($request->user(), $secret),
                'expires_at' => $expiresAt->toIso8601String(),
            ],
        ]);
    }

    public function confirm(
        ConfirmTwoFactorRequest $request,
        TotpAuthenticator $totp,
        RecordAuditLog $audit,
    ): JsonResponse {
        $this->ensureSession($request);
        $setup = $request->session()->get('security.two_factor_setup');

        if (! is_array($setup)
            || blank($setup['secret'] ?? null)
            || ($setup['expires_at'] ?? 0) < now()->getTimestamp()) {
            $request->session()->forget('security.two_factor_setup');

            throw ValidationException::withMessages([
                'code' => ['انتهت مهلة الإعداد. ابدأ تفعيل التحقق بخطوتين مرة أخرى.'],
            ]);
        }

        $step = $totp->verify($setup['secret'], $request->validated('code'));

        if ($step === null) {
            throw ValidationException::withMessages([
                'code' => ['رمز تطبيق المصادقة غير صحيح.'],
            ]);
        }

        $recoveryCodes = $totp->generateRecoveryCodes();
        $user = $request->user();
        $user->forceFill([
            'two_factor_secret' => $setup['secret'],
            'two_factor_recovery_codes' => $totp->hashRecoveryCodes($recoveryCodes),
            'two_factor_confirmed_at' => now(),
            'two_factor_last_used_step' => $step,
        ])->save();
        $request->session()->forget('security.two_factor_setup');

        $audit->handle(
            $request,
            'security.two_factor_enabled',
            'security',
            "تم تفعيل التحقق بخطوتين لحساب {$user->name}.",
            $user,
        );

        return response()->json([
            'data' => [
                'message' => 'تم تفعيل التحقق بخطوتين بنجاح.',
                'recovery_codes' => $recoveryCodes,
            ],
        ]);
    }

    public function regenerateRecoveryCodes(
        VerifyTwoFactorActionRequest $request,
        TotpAuthenticator $totp,
        RecordAuditLog $audit,
    ): JsonResponse {
        $recoveryCodes = DB::transaction(function () use ($request, $totp): array {
            $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            $this->ensureEnabled($user);

            if (! $this->verifyUserCode($user, $request->validated('code'), $totp)) {
                throw ValidationException::withMessages([
                    'code' => ['رمز التحقق أو الاسترداد غير صحيح.'],
                ]);
            }

            $recoveryCodes = $totp->generateRecoveryCodes();
            $user->forceFill([
                'two_factor_recovery_codes' => $totp->hashRecoveryCodes($recoveryCodes),
            ])->save();

            return $recoveryCodes;
        });
        $user = $request->user()->fresh();

        $audit->handle(
            $request,
            'security.recovery_codes_regenerated',
            'security',
            "تم إنشاء رموز استرداد جديدة لحساب {$user->name}.",
            $user,
        );

        return response()->json([
            'data' => [
                'message' => 'تم إنشاء رموز استرداد جديدة.',
                'recovery_codes' => $recoveryCodes,
            ],
        ]);
    }

    public function destroy(
        VerifyTwoFactorActionRequest $request,
        TotpAuthenticator $totp,
        RecordAuditLog $audit,
    ): JsonResponse {
        if ($this->twoFactorIsRequired($request->user())) {
            throw ValidationException::withMessages([
                'two_factor' => ['لا يمكن إيقاف التحقق بخطوتين لهذا الدور.'],
            ]);
        }

        $user = DB::transaction(function () use ($request, $totp): User {
            $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            $this->ensureEnabled($user);

            if (! $this->verifyUserCode($user, $request->validated('code'), $totp)) {
                throw ValidationException::withMessages([
                    'code' => ['رمز التحقق أو الاسترداد غير صحيح.'],
                ]);
            }

            $user->forceFill([
                'two_factor_secret' => null,
                'two_factor_recovery_codes' => null,
                'two_factor_confirmed_at' => null,
                'two_factor_last_used_step' => null,
            ])->save();

            return $user;
        });
        $audit->handle(
            $request,
            'security.two_factor_disabled',
            'security',
            "تم إيقاف التحقق بخطوتين لحساب {$user->name}.",
            $user,
        );

        return response()->json([
            'data' => [
                'message' => 'تم إيقاف التحقق بخطوتين.',
            ],
        ]);
    }

    private function verifyUserCode(
        User $user,
        string $code,
        TotpAuthenticator $totp,
    ): bool {
        if (preg_match('/^\d{6}$/', $code) === 1) {
            $step = $totp->verify((string) $user->two_factor_secret, $code);

            if ($step === null || $step <= (int) $user->two_factor_last_used_step) {
                return false;
            }

            $user->forceFill(['two_factor_last_used_step' => $step])->save();

            return true;
        }

        return $totp->consumeRecoveryCode($user, $code);
    }

    private function ensureEnabled(User $user): void
    {
        if (! $user->two_factor_confirmed_at) {
            throw ValidationException::withMessages([
                'two_factor' => ['التحقق بخطوتين غير مفعّل لهذا الحساب.'],
            ]);
        }
    }

    private function twoFactorIsRequired(User $user): bool
    {
        return config('security.require_privileged_two_factor')
            && in_array($user->role, config('security.privileged_roles'), true);
    }

    private function ensureSession(
        TwoFactorCodeRequest|StartTwoFactorSetupRequest|ConfirmTwoFactorRequest $request,
    ): void {
        if (! $request->hasSession()) {
            throw ValidationException::withMessages([
                'session' => ['هذه العملية تتطلب جلسة متصفح آمنة.'],
            ]);
        }
    }
}
