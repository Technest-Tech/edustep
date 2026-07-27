<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountSecurity
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->must_change_password) {
            return $this->requirementResponse(
                'password_change_required',
                'يجب تغيير كلمة المرور المؤقتة قبل متابعة استخدام النظام.',
            );
        }

        if (config('security.require_privileged_two_factor')
            && in_array($user?->role, config('security.privileged_roles'), true)
            && ! $user?->two_factor_confirmed_at) {
            return $this->requirementResponse(
                'two_factor_setup_required',
                'يجب تفعيل التحقق بخطوتين لهذا الحساب قبل متابعة استخدام النظام.',
            );
        }

        return $next($request);
    }

    private function requirementResponse(string $code, string $message): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'code' => $code,
        ], 428);
    }
}
