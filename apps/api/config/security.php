<?php

return [
    'require_privileged_two_factor' => (bool) env('REQUIRE_PRIVILEGED_2FA', false),
    'privileged_roles' => ['owner', 'accountant'],
    'two_factor' => [
        'issuer' => env('TWO_FACTOR_ISSUER', env('APP_NAME', 'EduStep Academy OS')),
        'challenge_lifetime_minutes' => (int) env('TWO_FACTOR_CHALLENGE_LIFETIME', 5),
        'setup_lifetime_minutes' => (int) env('TWO_FACTOR_SETUP_LIFETIME', 10),
        'recovery_code_count' => 8,
    ],
];
