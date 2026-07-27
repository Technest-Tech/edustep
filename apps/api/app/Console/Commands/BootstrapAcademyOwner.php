<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class BootstrapAcademyOwner extends Command
{
    protected $signature = 'academy:bootstrap-owner
                            {--name= : Full name of the initial owner}
                            {--email= : Email address of the initial owner}';

    protected $description = 'Securely create the first academy owner without development seed data';

    public function handle(): int
    {
        if (User::query()->where('role', 'owner')->exists()) {
            $this->components->error(
                'An owner account already exists. Use the management center to manage owner access.',
            );

            return self::FAILURE;
        }

        $name = trim((string) ($this->option('name') ?: $this->ask('Owner full name')));
        $email = mb_strtolower(trim(
            (string) ($this->option('email') ?: $this->ask('Owner email address')),
        ));
        $password = (string) $this->secret('Owner password');
        $confirmation = (string) $this->secret('Confirm owner password');
        $validator = Validator::make([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'password_confirmation' => $confirmation,
        ], [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:190', 'unique:users,email'],
            'password' => [
                'required',
                'confirmed',
                Password::min(12)->letters()->mixedCase()->numbers()->symbols(),
            ],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->components->error($error);
            }

            return self::FAILURE;
        }

        $owner = DB::transaction(function () use ($name, $email, $password): User {
            if (User::query()->where('role', 'owner')->lockForUpdate()->exists()) {
                throw new \RuntimeException('An owner account was created by another process.');
            }

            $owner = User::query()->create([
                'name' => $name,
                'email' => $email,
                'password' => $password,
                'locale' => 'ar',
                'timezone' => 'Africa/Cairo',
                'role' => 'owner',
                'status' => 'active',
            ]);
            $owner->forceFill([
                'email_verified_at' => now(),
                'must_change_password' => false,
                'password_changed_at' => now(),
            ])->save();

            return $owner;
        });

        $this->components->info("Initial owner [{$owner->email}] was created.");
        $this->components->warn(
            'Sign in now and complete two-factor authentication before granting access to anyone else.',
        );

        return self::SUCCESS;
    }
}
