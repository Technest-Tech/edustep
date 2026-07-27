<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class SessionController extends Controller
{
    /**
     * Start a first-party, cookie-based admin session.
     */
    public function store(LoginRequest $request): JsonResponse|UserResource
    {
        $credentials = [
            ...$request->safe()->only(['email', 'password']),
            'status' => 'active',
        ];

        if (! Auth::guard('web')->validate($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['بيانات تسجيل الدخول غير صحيحة.'],
            ]);
        }

        $user = User::query()
            ->where('email', $request->validated('email'))
            ->where('status', 'active')
            ->firstOrFail();

        if ($user->two_factor_confirmed_at) {
            $expiresAt = now()->addMinutes(
                config('security.two_factor.challenge_lifetime_minutes'),
            );
            $request->session()->regenerate();
            $request->session()->put('auth.two_factor', [
                'user_id' => $user->id,
                'remember' => $request->boolean('remember'),
                'expires_at' => $expiresAt->getTimestamp(),
            ]);

            return response()->json([
                'data' => [
                    'requires_two_factor' => true,
                    'challenge_expires_at' => $expiresAt->toIso8601String(),
                ],
            ], 202);
        }

        Auth::guard('web')->login($user, $request->boolean('remember'));
        $request->session()->regenerate();
        $user->forceFill(['last_login_at' => now()])->save();

        return new UserResource($user);
    }

    /**
     * End the current browser session.
     */
    public function destroy(LoginRequest $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'data' => [
                'message' => 'تم تسجيل الخروج بنجاح.',
            ],
        ]);
    }
}
