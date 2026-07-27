<?php

namespace Database\Seeders;

use App\Models\AcademySetting;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ManagementSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $password = env('SEED_ADMIN_PASSWORD', 'Admin@12345');
        $owner = User::query()->where('email', 'admin@edustep.local')->firstOrFail();

        $owner->update([
            'phone' => '01010000001',
            'job_title' => 'Founder & Academy Director',
        ]);
        User::query()->where('email', 'admissions@edustep.local')->update([
            'phone' => '01010000002',
            'job_title' => 'Admissions Specialist',
        ]);
        User::query()->where('email', 'sara@edustep.local')->update([
            'phone' => '01012345678',
            'job_title' => 'Senior English Teacher',
        ]);
        User::query()->where('email', 'mahmoud@edustep.local')->update([
            'phone' => '01087654321',
            'job_title' => 'General English Instructor',
        ]);
        User::query()->where('email', 'parent@edustep.local')->update([
            'phone' => '01088889999',
            'job_title' => null,
        ]);

        foreach ([
            [
                'name' => 'ريم مصطفى',
                'email' => 'manager@edustep.local',
                'phone' => '01010000003',
                'job_title' => 'Academic Manager',
                'role' => 'academic_manager',
            ],
            [
                'name' => 'أحمد فؤاد',
                'email' => 'operations@edustep.local',
                'phone' => '01010000004',
                'job_title' => 'Operations Coordinator',
                'role' => 'staff',
            ],
            [
                'name' => 'دينا أشرف',
                'email' => 'finance@edustep.local',
                'phone' => '01010000005',
                'job_title' => 'Accountant',
                'role' => 'accountant',
            ],
        ] as $member) {
            User::query()->updateOrCreate(
                ['email' => $member['email']],
                [
                    ...$member,
                    'password' => $password,
                    'locale' => 'ar',
                    'timezone' => 'Africa/Cairo',
                    'status' => 'active',
                    'email_verified_at' => now(),
                ],
            );
        }

        AcademySetting::query()->firstOrCreate([], [
            'academy_name' => 'EduStep English Academy',
            'academy_name_en' => 'EduStep English Academy',
            'phone' => '01010000000',
            'whatsapp_phone' => '01010000000',
            'email' => 'hello@edustep.local',
            'website' => 'https://edustep.example',
            'address' => 'المعادي، القاهرة، مصر',
            'timezone' => 'Africa/Cairo',
            'locale' => 'ar',
            'currency' => 'EGP',
            'invoice_prefix' => 'INV',
            'student_code_prefix' => 'ES',
            'offer_validity_days' => 7,
            'seat_hold_hours' => 48,
            'working_days' => ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
            'business_hours' => ['start' => '09:00', 'end' => '21:00'],
            'updated_by' => $owner->id,
        ]);
    }
}
