<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        abort_unless(
            $request->user() && in_array($request->user()->role, $roles, true),
            Response::HTTP_FORBIDDEN,
            'ليس لديك صلاحية لتنفيذ هذا الإجراء.',
        );

        return $next($request);
    }
}
