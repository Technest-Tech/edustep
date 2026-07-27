<?php

namespace Database\Seeders;

use App\Enums\AcademicRiskStatus;
use App\Enums\AssessmentStatus;
use App\Enums\AttendanceStatus;
use App\Enums\ClassSessionStatus;
use App\Enums\CohortStatus;
use App\Enums\EnrollmentStatus;
use App\Enums\ExpenseStatus;
use App\Enums\FollowUpPriority;
use App\Enums\FollowUpStatus;
use App\Enums\InstallmentStatus;
use App\Enums\InterventionStatus;
use App\Enums\InvoiceStatus;
use App\Enums\LeadSource;
use App\Enums\LeadStatus;
use App\Enums\MessageChannel;
use App\Enums\MessageStatus;
use App\Enums\ProgressRating;
use App\Enums\ProgressReportStatus;
use App\Enums\ServiceRequestStatus;
use App\Enums\StudentStatus;
use App\Enums\SubscriptionStatus;
use App\Enums\TeacherRateType;
use App\Models\AcademicRisk;
use App\Models\AcademyClosure;
use App\Models\ClassSession;
use App\Models\Cohort;
use App\Models\Enrollment;
use App\Models\Expense;
use App\Models\FamilyServiceRequest;
use App\Models\FollowUp;
use App\Models\GuardianProfile;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\LeadActivity;
use App\Models\Level;
use App\Models\Message;
use App\Models\MessageTemplate;
use App\Models\Payment;
use App\Models\PlacementAssessment;
use App\Models\Program;
use App\Models\ProgressEntry;
use App\Models\Student;
use App\Models\StudentProgressReport;
use App\Models\StudentSubscription;
use App\Models\StudyPackage;
use App\Models\TeacherProfile;
use App\Models\TeacherRateRule;
use App\Models\User;
use App\Modules\Finance\Actions\GenerateTeacherEarning;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $owner = User::query()->create([
            'name' => 'عمر أحمد',
            'email' => 'admin@edustep.local',
            'password' => env('SEED_ADMIN_PASSWORD', 'Admin@12345'),
            'role' => 'owner',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $admissions = User::query()->create([
            'name' => 'ندى محمود',
            'email' => 'admissions@edustep.local',
            'password' => env('SEED_ADMIN_PASSWORD', 'Admin@12345'),
            'role' => 'admissions',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $teacher = User::query()->create([
            'name' => 'سارة أحمد',
            'email' => 'sara@edustep.local',
            'password' => env('SEED_ADMIN_PASSWORD', 'Admin@12345'),
            'role' => 'teacher',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $teacherTwo = User::query()->create([
            'name' => 'محمود علاء',
            'email' => 'mahmoud@edustep.local',
            'password' => env('SEED_ADMIN_PASSWORD', 'Admin@12345'),
            'role' => 'teacher',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $guardianUser = User::query()->create([
            'name' => 'محمود السيد',
            'email' => 'parent@edustep.local',
            'password' => env('SEED_ADMIN_PASSWORD', 'Admin@12345'),
            'role' => 'guardian',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $guardianProfile = GuardianProfile::query()->create([
            'user_id' => $guardianUser->id,
            'phone' => '01088889999',
            'preferred_channel' => MessageChannel::WhatsApp->value,
            'relationship_label' => 'ولي أمر',
        ]);

        TeacherProfile::query()->create([
            'user_id' => $teacher->id,
            'phone' => '01012345678',
            'employment_type' => 'full_time',
            'specialization' => 'Kids & Teens English',
            'hourly_rate' => 260,
            'availability' => ['sunday', 'monday', 'wednesday', 'thursday'],
            'bio' => 'معلمة لغة إنجليزية متخصصة في بناء الثقة والمحادثة لدى الأطفال والمراهقين.',
        ]);

        TeacherProfile::query()->create([
            'user_id' => $teacherTwo->id,
            'phone' => '01087654321',
            'employment_type' => 'part_time',
            'specialization' => 'General & Business English',
            'hourly_rate' => 300,
            'availability' => ['saturday', 'sunday', 'tuesday'],
            'bio' => 'مدرب لغة إنجليزية للكبار يركز على المحادثة والاستخدام العملي.',
        ]);

        $kids = Program::query()->create([
            'code' => 'KIDS',
            'name_ar' => 'الإنجليزية للأطفال',
            'name_en' => 'Kids English',
            'description' => 'رحلة متدرجة لبناء اللغة والثقة لدى الأطفال.',
        ]);

        $general = Program::query()->create([
            'code' => 'GENERAL',
            'name_ar' => 'الإنجليزية العامة',
            'name_en' => 'General English',
            'description' => 'برنامج عملي للمراهقين والكبار وفق مستويات CEFR.',
        ]);

        TeacherRateRule::query()->create([
            'teacher_id' => $teacher->id,
            'rate_type' => TeacherRateType::Hourly,
            'amount' => 260,
            'effective_from' => today()->startOfYear(),
            'notes' => 'سعر الساعة الأساسي للعام الحالي.',
        ]);

        TeacherRateRule::query()->create([
            'teacher_id' => $teacherTwo->id,
            'rate_type' => TeacherRateType::FixedSession,
            'amount' => 450,
            'effective_from' => today()->startOfYear(),
            'notes' => 'سعر ثابت للحصة.',
        ]);

        $kidsStarter = Level::query()->create([
            'program_id' => $kids->id,
            'code' => 'STARTER',
            'name_ar' => 'مبتدئ',
            'name_en' => 'Starter',
            'sort_order' => 1,
        ]);

        $kidsA1 = Level::query()->create([
            'program_id' => $kids->id,
            'code' => 'A1',
            'name_ar' => 'المستوى A1',
            'name_en' => 'A1',
            'sort_order' => 2,
        ]);

        $kidsA2 = Level::query()->create([
            'program_id' => $kids->id,
            'code' => 'A2',
            'name_ar' => 'المستوى A2',
            'name_en' => 'A2',
            'sort_order' => 3,
        ]);

        $generalA1 = Level::query()->create([
            'program_id' => $general->id,
            'code' => 'A1',
            'name_ar' => 'المستوى A1',
            'name_en' => 'A1',
            'sort_order' => 1,
        ]);

        $generalB1 = Level::query()->create([
            'program_id' => $general->id,
            'code' => 'B1',
            'name_ar' => 'المستوى B1',
            'name_en' => 'B1',
            'sort_order' => 2,
        ]);

        $kidsPackage = StudyPackage::query()->create([
            'program_id' => $kids->id,
            'level_id' => $kidsA2->id,
            'code' => 'KIDS-A2-16',
            'name' => 'باقة Kids A2 · 16 حصة',
            'sessions_count' => 16,
            'duration_weeks' => 12,
            'price' => 1800,
            'default_installments' => 2,
            'description' => 'اشتراك مستوى A2 للأطفال بواقع حصتين أسبوعيًا.',
        ]);

        $generalB1Package = StudyPackage::query()->create([
            'program_id' => $general->id,
            'level_id' => $generalB1->id,
            'code' => 'GENERAL-B1-24',
            'name' => 'باقة General B1 · 24 حصة',
            'sessions_count' => 24,
            'duration_weeks' => 12,
            'price' => 2200,
            'default_installments' => 2,
            'description' => 'اشتراك الإنجليزية العامة للمستوى B1.',
        ]);

        $generalA1Package = StudyPackage::query()->create([
            'program_id' => $general->id,
            'level_id' => $generalA1->id,
            'code' => 'GENERAL-A1-24',
            'name' => 'باقة General A1 · 24 حصة',
            'sessions_count' => 24,
            'duration_weeks' => 12,
            'price' => 2400,
            'default_installments' => 3,
            'description' => 'باقة تأسيس للكبار مع خطة تقسيط مرنة.',
        ]);

        $kidsCohort = Cohort::query()->create([
            'program_id' => $kids->id,
            'level_id' => $kidsA2->id,
            'teacher_id' => $teacher->id,
            'code' => 'K-14',
            'name' => 'Kids A2 · المجموعة K-14',
            'status' => CohortStatus::Active,
            'delivery_mode' => 'online',
            'capacity' => 12,
            'fee' => 1800,
            'starts_on' => today()->subWeeks(2),
            'ends_on' => today()->addWeeks(10),
            'schedule' => [
                ['day' => 'sunday', 'time' => '16:00'],
                ['day' => 'wednesday', 'time' => '16:00'],
            ],
            'meeting_url' => 'https://meet.google.com/demo-k14',
        ]);

        $teenCohort = Cohort::query()->create([
            'program_id' => $general->id,
            'level_id' => $generalB1->id,
            'teacher_id' => $teacher->id,
            'code' => 'T-08',
            'name' => 'Teens B1 · المجموعة T-08',
            'status' => CohortStatus::Active,
            'delivery_mode' => 'onsite',
            'capacity' => 10,
            'fee' => 2200,
            'starts_on' => today()->subWeek(),
            'ends_on' => today()->addWeeks(11),
            'schedule' => [
                ['day' => 'sunday', 'time' => '17:30'],
                ['day' => 'thursday', 'time' => '17:30'],
            ],
            'room_name' => 'فرع المعادي · قاعة 2',
        ]);

        $newCohort = Cohort::query()->create([
            'program_id' => $general->id,
            'level_id' => $generalA1->id,
            'teacher_id' => $teacherTwo->id,
            'code' => 'A-21',
            'name' => 'Adults A1 · المجموعة A-21',
            'status' => CohortStatus::Enrolling,
            'delivery_mode' => 'online',
            'capacity' => 12,
            'fee' => 2400,
            'starts_on' => today()->addWeek(),
            'ends_on' => today()->addWeeks(13),
            'schedule' => [
                ['day' => 'sunday', 'time' => '19:00'],
                ['day' => 'tuesday', 'time' => '19:00'],
            ],
        ]);

        $leadDefinitions = [
            ['أحمد سامح', '01011112222', LeadSource::WhatsApp, LeadStatus::New, $kids, 9],
            ['والدة ليان', '01022223333', LeadSource::Facebook, LeadStatus::Contacted, $kids, 8],
            ['مريم خالد', '01033334444', LeadSource::Instagram, LeadStatus::AssessmentScheduled, $general, 17],
            ['يوسف شريف', '01044445555', LeadSource::Referral, LeadStatus::Qualified, $general, 24],
            ['والدة آدم', '01055556666', LeadSource::WhatsApp, LeadStatus::TrialScheduled, $kids, 10],
            ['نورهان علي', '01066667777', LeadSource::Website, LeadStatus::Contacted, $general, 28],
            ['محمد حسن', '01077778888', LeadSource::Facebook, LeadStatus::Lost, $general, 31],
            ['والد سيف', '01088889999', LeadSource::Referral, LeadStatus::Won, $kids, 11],
        ];

        foreach ($leadDefinitions as $index => [$name, $phone, $source, $status, $program, $age]) {
            $lead = Lead::query()->create([
                'owner_id' => $index % 2 === 0 ? $owner->id : $admissions->id,
                'interested_program_id' => $program->id,
                'full_name' => $name,
                'phone' => $phone,
                'whatsapp_phone' => $phone,
                'source' => $source,
                'status' => $status,
                'learner_age' => $age,
                'preferred_contact_channel' => 'whatsapp',
                'preferred_schedule' => $index % 2 === 0 ? 'مسائي' : 'بعد الظهر',
                'last_contacted_at' => $status === LeadStatus::New ? null : now()->subHours($index + 1),
                'lost_at' => $status === LeadStatus::Lost ? now()->subDay() : null,
                'lost_reason' => $status === LeadStatus::Lost ? 'الجدول غير مناسب' : null,
                'converted_at' => $status === LeadStatus::Won ? now()->subDays(2) : null,
                'notes' => $index === 0 ? 'يسأل عن نظام المتابعة والتقارير لولي الأمر.' : null,
                'created_at' => now()->subDays(8 - $index),
                'updated_at' => now()->subHours($index),
            ]);

            LeadActivity::query()->create([
                'lead_id' => $lead->id,
                'created_by' => $lead->owner_id,
                'type' => 'lead_created',
                'channel' => $source->value,
                'direction' => 'inbound',
                'title' => 'تم تسجيل العميل المحتمل',
                'details' => "وصل العميل من قناة {$source->label()}.",
                'occurred_at' => $lead->created_at,
            ]);

            if ($status !== LeadStatus::New) {
                LeadActivity::query()->create([
                    'lead_id' => $lead->id,
                    'created_by' => $lead->owner_id,
                    'type' => 'contact',
                    'channel' => 'whatsapp',
                    'direction' => 'outbound',
                    'title' => 'متابعة عبر WhatsApp',
                    'details' => 'تم شرح البرنامج والمواعيد والخطوة التالية.',
                    'occurred_at' => $lead->last_contacted_at,
                ]);
            }

            if (! in_array($status, [LeadStatus::Won, LeadStatus::Lost], true)) {
                FollowUp::query()->create([
                    'lead_id' => $lead->id,
                    'assigned_to' => $lead->owner_id,
                    'subject' => $index < 2 ? 'تأكيد الموعد المناسب' : 'متابعة قرار التسجيل',
                    'priority' => $index < 2 ? FollowUpPriority::High : FollowUpPriority::Medium,
                    'status' => FollowUpStatus::Pending,
                    'due_at' => $index === 1 ? now()->subHour() : now()->addHours($index + 2),
                ]);
            }

            if ($status === LeadStatus::AssessmentScheduled) {
                PlacementAssessment::query()->create([
                    'lead_id' => $lead->id,
                    'assessed_by' => $teacher->id,
                    'status' => AssessmentStatus::Scheduled,
                    'scheduled_at' => now()->addDay()->setTime(18, 0),
                ]);
            }

            if ($status === LeadStatus::Won) {
                $student = Student::query()->create([
                    'lead_id' => $lead->id,
                    'student_code' => 'ES-2026-001',
                    'full_name' => 'سيف محمود',
                    'phone' => $lead->phone,
                    'guardian_name' => 'والد سيف',
                    'guardian_phone' => $lead->phone,
                    'status' => StudentStatus::Active,
                    'joined_on' => today()->subDays(2),
                ]);

                Enrollment::query()->create([
                    'student_id' => $student->id,
                    'cohort_id' => $kidsCohort->id,
                    'status' => EnrollmentStatus::Active,
                    'enrolled_on' => today()->subDays(2),
                    'fee_amount' => $kidsCohort->fee,
                    'discount_amount' => 100,
                    'net_amount' => 1700,
                ]);
            }
        }

        foreach ([
            ['ES-2026-002', 'ليلى خالد', '01090001111', $kidsCohort],
            ['ES-2026-003', 'آدم محمد', '01090002222', $kidsCohort],
            ['ES-2026-004', 'عمر وائل', '01090003333', $teenCohort],
            ['ES-2026-005', 'ملك أشرف', '01090004444', $teenCohort],
            ['ES-2026-006', 'نور إبراهيم', '01090005555', $newCohort],
        ] as [$code, $name, $phone, $cohort]) {
            $student = Student::query()->create([
                'student_code' => $code,
                'full_name' => $name,
                'phone' => $phone,
                'status' => StudentStatus::Active,
                'joined_on' => today()->subWeeks(2),
            ]);

            Enrollment::query()->create([
                'student_id' => $student->id,
                'cohort_id' => $cohort->id,
                'status' => EnrollmentStatus::Active,
                'enrolled_on' => today()->subWeeks(2),
                'fee_amount' => $cohort->fee,
                'discount_amount' => 0,
                'net_amount' => $cohort->fee,
            ]);
        }

        $guardianProfile->students()->attach([
            Student::query()->where('student_code', 'ES-2026-001')->value('id') => [
                'relationship' => 'father',
                'is_primary' => true,
            ],
            Student::query()->where('student_code', 'ES-2026-002')->value('id') => [
                'relationship' => 'guardian',
                'is_primary' => true,
            ],
        ]);

        Enrollment::query()
            ->with(['student', 'cohort'])
            ->oldest()
            ->get()
            ->each(function (Enrollment $enrollment, int $index) use ($owner): void {
                $isPaid = in_array($index, [0, 3], true);
                $isPartial = in_array($index, [1, 5], true);
                $isOverdue = $index === 2;
                $invoice = Invoice::query()->create([
                    'student_id' => $enrollment->student_id,
                    'enrollment_id' => $enrollment->id,
                    'invoice_number' => sprintf('INV-2026-%04d', $index + 1),
                    'status' => $isPaid
                        ? InvoiceStatus::Paid
                        : ($isPartial ? InvoiceStatus::PartiallyPaid : ($isOverdue ? InvoiceStatus::Overdue : InvoiceStatus::Issued)),
                    'issued_on' => today()->subDays(14 - $index),
                    'due_on' => $isOverdue ? today()->subDays(3) : today()->addDays($index + 2),
                    'subtotal' => $enrollment->fee_amount,
                    'discount_amount' => $enrollment->discount_amount,
                    'total_amount' => $enrollment->net_amount,
                    'notes' => 'رسوم التسجيل في '.$enrollment->cohort->name,
                ]);

                if ($isPaid || $isPartial) {
                    Payment::query()->create([
                        'invoice_id' => $invoice->id,
                        'student_id' => $enrollment->student_id,
                        'recorded_by' => $owner->id,
                        'payment_number' => sprintf('PAY-2026-%04d', $index + 1),
                        'amount' => $isPaid
                            ? $enrollment->net_amount
                            : round((float) $enrollment->net_amount / 2, 2),
                        'method' => $index % 2 === 0 ? 'instapay' : 'cash',
                        'paid_at' => now()->subDays(max(1, 8 - $index)),
                        'reference' => $index % 2 === 0 ? 'IP-DEMO-'.$index : null,
                    ]);
                }
            });

        $sief = Student::query()
            ->with('enrollments.cohort')
            ->where('student_code', 'ES-2026-001')
            ->firstOrFail();
        $leila = Student::query()
            ->with('enrollments.cohort')
            ->where('student_code', 'ES-2026-002')
            ->firstOrFail();
        $siefEnrollment = $sief->enrollments->firstOrFail();
        $leilaEnrollment = $leila->enrollments->firstOrFail();

        StudentProgressReport::query()->create([
            'student_id' => $sief->id,
            'enrollment_id' => $siefEnrollment->id,
            'level_id' => $siefEnrollment->cohort->level_id,
            'created_by' => $teacher->id,
            'published_by' => $owner->id,
            'period_label' => 'تقرير يوليو 2026',
            'period_starts_on' => today()->startOfMonth(),
            'period_ends_on' => today()->endOfMonth(),
            'status' => ProgressReportStatus::Published,
            'overall_score' => 78,
            'overall_rating' => ProgressRating::Good,
            'attendance_rate' => 100,
            'summary' => 'أظهر سيف تقدمًا ثابتًا في المحادثة وفهم التعليمات داخل الحصة.',
            'strengths' => 'الثقة في التحدث، سرعة استيعاب المفردات، والمشاركة الإيجابية.',
            'areas_for_improvement' => 'دقة النطق والالتزام بالمراجعة القصيرة بين الحصص.',
            'next_steps' => 'تدريب نطق لمدة عشر دقائق ثلاث مرات أسبوعيًا.',
            'published_at' => now()->subDay(),
        ]);

        StudentProgressReport::query()->create([
            'student_id' => $leila->id,
            'enrollment_id' => $leilaEnrollment->id,
            'level_id' => $leilaEnrollment->cohort->level_id,
            'created_by' => $teacher->id,
            'period_label' => 'تقرير يوليو 2026',
            'period_starts_on' => today()->startOfMonth(),
            'period_ends_on' => today()->endOfMonth(),
            'status' => ProgressReportStatus::Draft,
            'overall_score' => 70,
            'overall_rating' => ProgressRating::Good,
            'attendance_rate' => 75,
            'summary' => 'أداء جيد عند الحضور مع حاجة لمتابعة انتظام الحصص والواجبات.',
            'strengths' => 'الاستيعاب والمفردات.',
            'areas_for_improvement' => 'الانتظام والتطبيق المنزلي.',
            'next_steps' => 'متابعة أسبوعية قصيرة مع ولي الأمر.',
        ]);

        $attendanceRisk = AcademicRisk::query()->create([
            'student_id' => $leila->id,
            'enrollment_id' => $leilaEnrollment->id,
            'assigned_to' => $teacher->id,
            'type' => 'attendance',
            'severity' => 'high',
            'status' => AcademicRiskStatus::Monitoring,
            'title' => 'تكرار الغياب يؤثر على استمرارية المستوى',
            'description' => 'تم تسجيل غياب حديث ويحتاج انتظام الحضور إلى متابعة مبكرة.',
            'is_automatic' => true,
            'detected_at' => now()->subDays(2),
            'metadata' => ['attendance_rate' => 75, 'sample_size' => 4],
        ]);
        $attendanceRisk->interventions()->create([
            'student_id' => $leila->id,
            'owner_id' => $teacher->id,
            'created_by' => $owner->id,
            'type' => 'parent_call',
            'status' => InterventionStatus::InProgress,
            'title' => 'اتصال متابعة مع ولي الأمر',
            'plan' => 'تحديد أسباب الغياب والاتفاق على خطة حضور للأسبوعين القادمين.',
            'due_on' => today()->addDays(2),
        ]);

        FamilyServiceRequest::query()->create([
            'guardian_id' => $guardianProfile->id,
            'student_id' => $sief->id,
            'assigned_to' => $admissions->id,
            'request_number' => 'REQ-2026-DEMO01',
            'category' => 'schedule',
            'priority' => 'normal',
            'status' => ServiceRequestStatus::InProgress,
            'subject' => 'الاستفسار عن موعد الحصة التعويضية',
            'description' => 'نحتاج معرفة الموعد المناسب للحصة التعويضية القادمة.',
        ]);

        FamilyServiceRequest::query()->create([
            'guardian_id' => $guardianProfile->id,
            'student_id' => $leila->id,
            'request_number' => 'REQ-2026-DEMO02',
            'category' => 'academic',
            'priority' => 'high',
            'status' => ServiceRequestStatus::Resolved,
            'subject' => 'طلب مكالمة لمناقشة مستوى ليلى',
            'description' => 'نرغب في فهم نقاط التحسن وخطة المتابعة خلال الشهر.',
            'resolution' => 'تم التواصل ومشاركة خطة الحضور والمراجعة الأسبوعية.',
            'resolved_at' => now()->subDay(),
        ]);

        Enrollment::query()
            ->with(['student', 'cohort', 'invoices.payments'])
            ->oldest()
            ->limit(4)
            ->get()
            ->each(function (Enrollment $enrollment, int $index) use (
                $owner,
                $kidsPackage,
                $generalA1Package,
                $generalB1Package,
            ): void {
                $package = $enrollment->cohort->program_id === $kidsPackage->program_id
                    ? $kidsPackage
                    : ($enrollment->cohort->level_id === $generalB1Package->level_id
                        ? $generalB1Package
                        : $generalA1Package);
                $invoice = $enrollment->invoices->firstOrFail();
                $startsOn = $enrollment->enrolled_on;
                $endsOn = $startsOn->copy()->addWeeks($package->duration_weeks)->subDay();
                $subscription = StudentSubscription::query()->create([
                    'student_id' => $enrollment->student_id,
                    'enrollment_id' => $enrollment->id,
                    'study_package_id' => $package->id,
                    'created_by' => $owner->id,
                    'status' => $index === 2 ? SubscriptionStatus::Frozen : SubscriptionStatus::Active,
                    'starts_on' => $startsOn,
                    'ends_on' => $endsOn,
                    'renewal_due_on' => $endsOn->copy()->subDays(7),
                    'included_sessions' => $package->sessions_count,
                    'price_amount' => $package->price,
                    'discount_amount' => max(0, (float) $package->price - (float) $invoice->total_amount),
                    'net_amount' => $invoice->total_amount,
                    'frozen_at' => $index === 2 ? now()->subDay() : null,
                    'frozen_until' => $index === 2 ? today()->addWeek() : null,
                    'notes' => $index === 2 ? 'تجميد مؤقت بطلب ولي الأمر.' : null,
                ]);
                $installmentStatus = match ($invoice->status) {
                    InvoiceStatus::Paid => InstallmentStatus::Paid,
                    InvoiceStatus::PartiallyPaid => InstallmentStatus::PartiallyPaid,
                    InvoiceStatus::Overdue => InstallmentStatus::Overdue,
                    default => InstallmentStatus::Invoiced,
                };

                $subscription->installments()->create([
                    'invoice_id' => $invoice->id,
                    'installment_number' => 1,
                    'amount' => $invoice->total_amount,
                    'due_on' => $invoice->due_on,
                    'status' => $installmentStatus,
                    'paid_at' => $installmentStatus === InstallmentStatus::Paid
                        ? $invoice->payments->max('paid_at')
                        : null,
                ]);
            });

        Cohort::query()
            ->with(['enrollments.student'])
            ->get()
            ->each(function (Cohort $cohort) use ($owner): void {
                if ($cohort->status === CohortStatus::Active) {
                    foreach ([9, 6, 3, 1] as $sessionIndex => $daysAgo) {
                        $startsAt = now()
                            ->subDays($daysAgo)
                            ->setTime($cohort->delivery_mode === 'online' ? 16 : 17, 30);
                        $classSession = ClassSession::query()->create([
                            'cohort_id' => $cohort->id,
                            'teacher_id' => $cohort->teacher_id,
                            'title' => 'الحصة '.($sessionIndex + 1).' · مهارات التواصل',
                            'status' => ClassSessionStatus::Completed,
                            'starts_at' => $startsAt,
                            'ends_at' => $startsAt->copy()->addMinutes(90),
                            'meeting_url' => $cohort->meeting_url,
                            'room_name' => $cohort->room_name,
                            'lesson_focus' => $sessionIndex % 2 === 0
                                ? 'المفردات والمحادثة في مواقف الحياة اليومية.'
                                : 'الاستماع والتطبيق العملي على القواعد.',
                            'teacher_notes' => $sessionIndex === 3
                                ? 'مشاركة جيدة من أغلب الطلاب، مع حاجة لمراجعة الواجب.'
                                : null,
                            'completed_at' => $startsAt->copy()->addMinutes(90),
                        ]);

                        $cohort->enrollments
                            ->filter(fn (Enrollment $enrollment) => $enrollment->enrolled_on->lte($startsAt))
                            ->values()
                            ->each(function (Enrollment $enrollment, int $studentIndex) use (
                                $classSession,
                                $owner,
                                $sessionIndex,
                            ): void {
                                $status = match (($studentIndex + $sessionIndex) % 7) {
                                    4 => AttendanceStatus::Absent,
                                    5 => AttendanceStatus::Late,
                                    default => AttendanceStatus::Present,
                                };

                                $classSession->attendanceRecords()->create([
                                    'student_id' => $enrollment->student_id,
                                    'recorded_by' => $owner->id,
                                    'status' => $status,
                                    'checked_in_at' => in_array($status, [AttendanceStatus::Present, AttendanceStatus::Late], true)
                                        ? $classSession->starts_at
                                        : null,
                                ]);
                            });
                    }
                }

                foreach ([2, 5] as $futureIndex => $daysAhead) {
                    $startsAt = now()
                        ->addDays($daysAhead)
                        ->setTime($cohort->delivery_mode === 'online' ? 18 : 17, 30);

                    ClassSession::query()->create([
                        'cohort_id' => $cohort->id,
                        'teacher_id' => $cohort->teacher_id,
                        'title' => 'الحصة القادمة '.($futureIndex + 1),
                        'status' => ClassSessionStatus::Scheduled,
                        'starts_at' => $startsAt,
                        'ends_at' => $startsAt->copy()->addMinutes(90),
                        'meeting_url' => $cohort->meeting_url,
                        'room_name' => $cohort->room_name,
                        'lesson_focus' => 'استكمال أهداف الوحدة الحالية وتطبيقات المحادثة.',
                    ]);
                }
            });

        $todayStart = today()->setTime(18, 0);
        ClassSession::query()->create([
            'cohort_id' => $kidsCohort->id,
            'teacher_id' => $teacher->id,
            'title' => 'مراجعة الوحدة ومحادثة تطبيقية',
            'status' => ClassSessionStatus::Scheduled,
            'starts_at' => $todayStart,
            'ends_at' => $todayStart->copy()->addMinutes(90),
            'meeting_url' => $kidsCohort->meeting_url,
            'lesson_focus' => 'مراجعة أهداف الوحدة مع نشاط محادثة جماعي.',
        ]);

        ClassSession::query()
            ->where('status', ClassSessionStatus::Completed)
            ->get()
            ->each(fn (ClassSession $session) => app(GenerateTeacherEarning::class)->execute($session));

        $closureDate = today()->next('Sunday');
        AcademyClosure::query()->create([
            'name' => 'إجازة صيانة دورية',
            'starts_on' => $closureDate,
            'ends_on' => $closureDate,
            'affects_online' => true,
            'reason' => 'توقف مجدول ضمن بيانات العرض.',
            'created_by' => $owner->id,
        ]);

        foreach ([
            ['منصات وبرامج', 'Zoom', 'اشتراك منصة الاجتماعات', 1200, ExpenseStatus::Paid, today()->subDays(18)],
            ['إيجارات', 'فرع المعادي', 'إيجار قاعة التدريب', 6500, ExpenseStatus::Paid, today()->subDays(12)],
            ['تسويق', 'Meta Ads', 'حملة إعلانات التسجيل الصيفي', 3200, ExpenseStatus::Approved, today()->subDays(6)],
            ['أدوات تعليمية', 'مكتبة الأمل', 'كتب وأنشطة مطبوعة', 1850, ExpenseStatus::Submitted, today()->subDays(2)],
        ] as $index => [$category, $vendor, $description, $amount, $status, $incurredOn]) {
            Expense::query()->create([
                'expense_number' => sprintf('EXP-%s-%04d', now()->format('Y'), $index + 1),
                'category' => $category,
                'vendor_name' => $vendor,
                'description' => $description,
                'amount' => $amount,
                'status' => $status,
                'incurred_on' => $incurredOn,
                'due_on' => $incurredOn->copy()->addDays(7),
                'payment_method' => $status === ExpenseStatus::Paid ? 'bank_transfer' : null,
                'paid_at' => $status === ExpenseStatus::Paid ? $incurredOn->copy()->endOfDay() : null,
                'created_by' => $owner->id,
                'approved_by' => in_array($status, [ExpenseStatus::Approved, ExpenseStatus::Paid], true)
                    ? $owner->id
                    : null,
                'approved_at' => in_array($status, [ExpenseStatus::Approved, ExpenseStatus::Paid], true)
                    ? $incurredOn->copy()->endOfDay()
                    : null,
            ]);
        }

        Enrollment::query()
            ->with(['student', 'cohort.level'])
            ->oldest()
            ->get()
            ->each(function (Enrollment $enrollment, int $index): void {
                ProgressEntry::query()->create([
                    'student_id' => $enrollment->student_id,
                    'enrollment_id' => $enrollment->id,
                    'level_id' => $enrollment->cohort->level_id,
                    'evaluator_id' => $enrollment->cohort->teacher_id,
                    'type' => $index % 2 === 0 ? 'speaking' : 'assessment',
                    'title' => $index % 2 === 0 ? 'تقييم المحادثة الأسبوعي' : 'تقييم الوحدة الأولى',
                    'score' => 72 + ($index * 4),
                    'rating' => $index >= 4 ? ProgressRating::Excellent : ProgressRating::Good,
                    'feedback' => $index % 2 === 0
                        ? 'تقدم واضح في الثقة واستخدام المفردات. يحتاج إلى تدريب أكثر على النطق.'
                        : 'استيعاب جيد للأهداف الأساسية مع ضرورة الاستمرار في حل الواجبات.',
                    'occurred_on' => today()->subDays(3 + $index),
                ]);
            });

        $progressTemplate = MessageTemplate::query()->create([
            'key' => 'weekly-progress',
            'name' => 'ملخص التقدم الأسبوعي',
            'channel' => MessageChannel::Internal,
            'subject' => 'تحديث جديد عن {{student_name}}',
            'body' => 'أهلًا {{guardian_name}}، أضفنا تحديثًا جديدًا عن تقدم {{student_name}} داخل بوابة {{academy_name}}.',
            'created_by' => $owner->id,
        ]);

        MessageTemplate::query()->create([
            'key' => 'payment-reminder',
            'name' => 'تذكير بموعد السداد',
            'channel' => MessageChannel::WhatsApp,
            'body' => 'أهلًا {{guardian_name}}، نذكّرك بلطف بمراجعة الفاتورة الخاصة بـ {{student_name}}. شكرًا لتعاونك مع {{academy_name}}.',
            'created_by' => $owner->id,
        ]);

        Message::query()->create([
            'sender_id' => $owner->id,
            'guardian_id' => $guardianProfile->id,
            'student_id' => $sief->id,
            'message_template_id' => $progressTemplate->id,
            'channel' => MessageChannel::Internal,
            'direction' => 'outbound',
            'subject' => 'تحديث جديد عن سيف محمود',
            'body' => 'مشاركة سيف هذا الأسبوع ممتازة، وظهر تحسن واضح في الثقة أثناء المحادثة.',
            'status' => MessageStatus::Delivered,
            'sent_at' => now()->subDay(),
            'delivered_at' => now()->subDay(),
            'metadata' => ['provider_connected' => true],
        ]);

        Message::query()->create([
            'sender_id' => $owner->id,
            'guardian_id' => $guardianProfile->id,
            'student_id' => $sief->id,
            'channel' => MessageChannel::WhatsApp,
            'direction' => 'outbound',
            'body' => 'تذكير تجريبي بموعد السداد الخاص بسيف.',
            'status' => MessageStatus::Queued,
            'metadata' => [
                'provider_connected' => false,
                'delivery_note' => 'بانتظار ربط مزود WhatsApp الرسمي.',
            ],
        ]);

        $this->call([
            AdmissionPipelineSeeder::class,
            ManagementSeeder::class,
        ]);
    }
}
