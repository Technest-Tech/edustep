<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\ForgotPasswordRequest;
use App\Http\Requests\Api\V1\Auth\ResetPasswordRequest;
use App\Models\User;
use App\Modules\Management\Actions\RecordAuditLog;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    public function store(ForgotPasswordRequest $request): JsonResponse
    {
        Password::sendResetLink($request->only('email'));

        return response()->json([
            'data' => [
                'message' => 'إذا كان البريد مسجلًا فسنرسل إليه رابطًا آمنًا لإعادة كلمة المرور.',
            ],
        ]);
    }

    public function update(
        ResetPasswordRequest $request,
        RecordAuditLog $audit,
    ): JsonResponse {
        $status = Password::reset(
            $request->safe()->only([
                'email',
                'password',
                'password_confirmation',
                'token',
            ]),
            function (User $user, string $password) use ($request, $audit): void {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                    'must_change_password' => false,
                    'password_changed_at' => now(),
                ])->save();
                $user->tokens()->delete();

                if (Schema::hasTable(config('session.table'))) {
                    DB::table(config('session.table'))
                        ->where('user_id', $user->id)
                        ->delete();
                }

                event(new PasswordReset($user));
                $audit->handle(
                    $request,
                    'security.password_reset',
                    'security',
                    "تمت إعادة تعيين كلمة مرور حساب {$user->name} وإغلاق جلساته.",
                    $user,
                    null,
                    null,
                    ['password'],
                );
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => ['رابط إعادة التعيين غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.'],
            ]);
        }

        return response()->json([
            'data' => [
                'message' => 'تم تغيير كلمة المرور. يمكنك تسجيل الدخول الآن.',
            ],
        ]);
    }
}
