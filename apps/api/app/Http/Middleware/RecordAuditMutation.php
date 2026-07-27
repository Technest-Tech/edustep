<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class RecordAuditMutation
{
    private const SENSITIVE_FIELDS = [
        'password',
        'password_confirmation',
        'current_password',
        'code',
        'recovery_code',
        'one_time_password',
        'token',
        'remember_token',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $actorBefore = $request->user();
        $response = $next($request);

        if ($request->isMethodSafe()
            || $response->getStatusCode() >= 400
            || $request->attributes->get('audit_recorded')) {
            return $response;
        }

        $actor = $actorBefore ?? $request->user();

        if (! $actor) {
            return $response;
        }

        try {
            $routeName = $request->route()?->getName();
            $parameters = $request->route()?->parameters() ?? [];
            $auditable = collect($parameters)->first(
                fn ($value) => $value instanceof Model,
            );
            $changedFields = array_values(array_diff(
                array_keys($request->all()),
                self::SENSITIVE_FIELDS,
            ));

            AuditLog::query()->create([
                'actor_id' => $actor->id,
                'action' => $routeName ?: strtolower($request->method()).'.'.$request->path(),
                'category' => $this->categoryFor($routeName),
                'auditable_type' => $auditable?->getMorphClass(),
                'auditable_id' => $auditable?->getKey(),
                'description' => $this->descriptionFor($routeName),
                'method' => $request->method(),
                'route_name' => $routeName,
                'request_id' => $request->attributes->get('request_id'),
                'ip_address' => $request->ip(),
                'user_agent' => mb_substr((string) $request->userAgent(), 0, 500),
                'changed_fields' => $changedFields ?: null,
                'metadata' => [
                    'response_status' => $response->getStatusCode(),
                    'route_parameters' => collect($parameters)
                        ->map(fn ($value) => $value instanceof Model ? $value->getKey() : $value)
                        ->all(),
                ],
                'created_at' => now(),
            ]);
        } catch (Throwable $exception) {
            Log::warning('Audit log recording failed.', [
                'request_id' => $request->attributes->get('request_id'),
                'route_name' => $request->route()?->getName(),
                'exception' => $exception->getMessage(),
            ]);
        }

        return $response;
    }

    private function categoryFor(?string $routeName): string
    {
        return match (true) {
            str_contains((string) $routeName, 'finance'),
            str_contains((string) $routeName, 'billing'),
            str_contains((string) $routeName, 'payroll') => 'finance',
            str_contains((string) $routeName, 'admissions'),
            str_contains((string) $routeName, 'offers'),
            str_contains((string) $routeName, 'trials'),
            str_contains((string) $routeName, 'waitlist'),
            str_contains((string) $routeName, 'seat-reservations') => 'admissions',
            str_contains((string) $routeName, 'leads'),
            str_contains((string) $routeName, 'follow-ups') => 'crm',
            str_contains((string) $routeName, 'cohorts'),
            str_contains((string) $routeName, 'class-sessions'),
            str_contains((string) $routeName, 'progress') => 'academics',
            str_contains((string) $routeName, 'auth'),
            str_contains((string) $routeName, 'security'),
            str_contains((string) $routeName, 'two-factor') => 'security',
            default => 'operations',
        };
    }

    private function descriptionFor(?string $routeName): string
    {
        return match ($this->categoryFor($routeName)) {
            'finance' => 'تم تنفيذ تغيير مالي داخل النظام.',
            'admissions' => 'تم تنفيذ تغيير في رحلة القبول والتسجيل.',
            'crm' => 'تم تحديث بيانات أو متابعة عميل.',
            'academics' => 'تم تنفيذ تغيير في التشغيل الأكاديمي.',
            'security' => 'تم تنفيذ إجراء متعلق بالجلسة أو الدخول.',
            default => 'تم تنفيذ تغيير تشغيلي داخل النظام.',
        };
    }
}
