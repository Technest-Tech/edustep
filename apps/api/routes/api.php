<?php

use App\Http\Controllers\Api\V1\Academics\AcademyClosureController;
use App\Http\Controllers\Api\V1\Academics\AttendanceController;
use App\Http\Controllers\Api\V1\Academics\CalendarController;
use App\Http\Controllers\Api\V1\Academics\ClassSessionController;
use App\Http\Controllers\Api\V1\Academics\CohortController;
use App\Http\Controllers\Api\V1\Academics\CohortScheduleController;
use App\Http\Controllers\Api\V1\Academics\ProgramController;
use App\Http\Controllers\Api\V1\Admissions\AdmissionPipelineController;
use App\Http\Controllers\Api\V1\Auth\PasswordResetController;
use App\Http\Controllers\Api\V1\Auth\SessionController;
use App\Http\Controllers\Api\V1\Billing\StudyPackageController;
use App\Http\Controllers\Api\V1\Billing\SubscriptionController;
use App\Http\Controllers\Api\V1\Communication\GuardianController;
use App\Http\Controllers\Api\V1\Communication\MessageController;
use App\Http\Controllers\Api\V1\Communication\MessageTemplateController;
use App\Http\Controllers\Api\V1\CRM\FollowUpController;
use App\Http\Controllers\Api\V1\CRM\LeadActivityController;
use App\Http\Controllers\Api\V1\CRM\LeadController;
use App\Http\Controllers\Api\V1\CRM\LeadConversionController;
use App\Http\Controllers\Api\V1\CRM\PlacementAssessmentController;
use App\Http\Controllers\Api\V1\Dashboard\DashboardController;
use App\Http\Controllers\Api\V1\Family\FamilyHomeController;
use App\Http\Controllers\Api\V1\Family\FamilyServiceRequestController;
use App\Http\Controllers\Api\V1\Finance\ExpenseController;
use App\Http\Controllers\Api\V1\Finance\FinanceSummaryController;
use App\Http\Controllers\Api\V1\Finance\InvoiceController;
use App\Http\Controllers\Api\V1\Finance\PaymentController;
use App\Http\Controllers\Api\V1\Finance\PayrollController;
use App\Http\Controllers\Api\V1\Finance\TeacherEarningController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\Management\ManagementCenterController;
use App\Http\Controllers\Api\V1\Management\NotificationCenterController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\People\TeacherController;
use App\Http\Controllers\Api\V1\ReadinessController;
use App\Http\Controllers\Api\V1\Reports\OperationsReportController;
use App\Http\Controllers\Api\V1\Security\AccountSecurityController;
use App\Http\Controllers\Api\V1\Security\TwoFactorAuthenticationController;
use App\Http\Controllers\Api\V1\Students\AcademicProgressController;
use App\Http\Controllers\Api\V1\Students\AcademicRiskController;
use App\Http\Controllers\Api\V1\Students\ProgressEntryController;
use App\Http\Controllers\Api\V1\Students\StudentController;
use App\Http\Controllers\Api\V1\Students\StudentProgressReportController;
use App\Http\Controllers\Api\V1\Teacher\TeacherEarningsController;
use App\Http\Controllers\Api\V1\Teacher\TeacherTodayController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function (): void {
    Route::get('/health', HealthController::class)->name('health');
    Route::get('/readiness', ReadinessController::class)->name('readiness');

    Route::prefix('auth')->name('auth.')->group(function (): void {
        Route::post('/login', [SessionController::class, 'store'])
            ->middleware('throttle:10,1')
            ->name('login');
        Route::post('/two-factor-challenge', [TwoFactorAuthenticationController::class, 'challenge'])
            ->middleware('throttle:10,1')
            ->name('two-factor.challenge');
        Route::post('/forgot-password', [PasswordResetController::class, 'store'])
            ->middleware('throttle:5,1')
            ->name('password.email');
        Route::post('/reset-password', [PasswordResetController::class, 'update'])
            ->middleware('throttle:5,1')
            ->name('password.update');

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::get('/me', MeController::class)->name('me');
            Route::post('/logout', [SessionController::class, 'destroy'])
                ->name('logout');
        });
    });

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::prefix('me/security')->name('security.')->group(function (): void {
            Route::get('/', [AccountSecurityController::class, 'show'])->name('show');
            Route::put('/password', [AccountSecurityController::class, 'updatePassword'])
                ->name('password.update');
            Route::post('/two-factor/setup', [TwoFactorAuthenticationController::class, 'setup'])
                ->name('two-factor.setup');
            Route::post('/two-factor/confirm', [TwoFactorAuthenticationController::class, 'confirm'])
                ->name('two-factor.confirm');
            Route::post('/two-factor/recovery-codes', [TwoFactorAuthenticationController::class, 'regenerateRecoveryCodes'])
                ->name('two-factor.recovery-codes');
            Route::delete('/two-factor', [TwoFactorAuthenticationController::class, 'destroy'])
                ->name('two-factor.destroy');
            Route::delete('/sessions/others', [AccountSecurityController::class, 'destroyOtherSessions'])
                ->name('sessions.others.destroy');
            Route::delete('/sessions/{session}', [AccountSecurityController::class, 'destroySession'])
                ->name('sessions.destroy');
        });

        Route::middleware('account.secure')->group(function (): void {
            Route::get('/dashboard', DashboardController::class)
                ->middleware('role:owner,staff,admissions,academic_manager,accountant')
                ->name('dashboard');
            Route::get('/calendar', CalendarController::class)
                ->middleware('role:owner,academic_manager,teacher')
                ->name('calendar');
            Route::get('/notifications', NotificationCenterController::class)
                ->middleware('role:owner,staff,admissions,academic_manager,accountant,teacher')
                ->name('notifications.index');
            Route::get('/reports/operations', OperationsReportController::class)
                ->middleware('role:owner,academic_manager,accountant')
                ->name('reports.operations');

            Route::prefix('management')
                ->middleware('role:owner')
                ->name('management.')
                ->group(function (): void {
                    Route::get('/', [ManagementCenterController::class, 'index'])
                        ->name('index');
                    Route::patch('/settings', [ManagementCenterController::class, 'updateSettings'])
                        ->name('settings.update');
                    Route::post('/team', [ManagementCenterController::class, 'storeTeamMember'])
                        ->name('team.store');
                    Route::patch('/team/{user}', [ManagementCenterController::class, 'updateTeamMember'])
                        ->name('team.update');
                    Route::post('/team/{user}/password', [ManagementCenterController::class, 'updatePassword'])
                        ->name('team.password.update');
                });

            Route::get('/programs', [ProgramController::class, 'index'])
                ->middleware('role:owner,staff,admissions,academic_manager,teacher')
                ->name('programs.index');
            Route::get('/cohorts', [CohortController::class, 'index'])
                ->middleware('role:owner,staff,admissions,academic_manager,teacher')
                ->name('cohorts.index');
            Route::get('/cohorts/{cohort}', [CohortController::class, 'show'])
                ->middleware('role:owner,academic_manager,teacher')
                ->name('cohorts.show');
            Route::post('/cohorts', [CohortController::class, 'store'])
                ->middleware('role:owner,academic_manager')
                ->name('cohorts.store');
            Route::middleware('role:owner,academic_manager,teacher')->group(function (): void {
                Route::post('/cohorts/{cohort}/sessions', [ClassSessionController::class, 'store'])
                    ->name('cohorts.sessions.store');
                Route::post('/cohorts/{cohort}/generate-sessions', [CohortScheduleController::class, 'store'])
                    ->name('cohorts.sessions.generate');
                Route::patch('/class-sessions/{classSession}', [ClassSessionController::class, 'update'])
                    ->name('class-sessions.update');
                Route::put('/class-sessions/{classSession}/attendance', [AttendanceController::class, 'update'])
                    ->name('class-sessions.attendance.update');
                Route::post('/students/{student}/progress', [ProgressEntryController::class, 'store'])
                    ->name('students.progress.store');
            });
            Route::get('/teachers', [TeacherController::class, 'index'])
                ->middleware('role:owner,academic_manager')
                ->name('teachers.index');
            Route::get('/teachers/{teacher}', [TeacherController::class, 'show'])
                ->middleware('role:owner,academic_manager')
                ->name('teachers.show');
            Route::get('/academy-closures', [AcademyClosureController::class, 'index'])
                ->middleware('role:owner,academic_manager')
                ->name('academy-closures.index');
            Route::post('/academy-closures', [AcademyClosureController::class, 'store'])
                ->middleware('role:owner,academic_manager')
                ->name('academy-closures.store');

            Route::get('/students', [StudentController::class, 'index'])
                ->middleware('role:owner,staff,admissions,academic_manager,accountant,teacher')
                ->name('students.index');
            Route::get('/students/{student}', [StudentController::class, 'show'])
                ->middleware('role:owner,staff,admissions,academic_manager,accountant,teacher')
                ->name('students.show');
            Route::get('/academic-progress', AcademicProgressController::class)
                ->middleware('role:owner,academic_manager,teacher')
                ->name('academic-progress.index');
            Route::middleware('role:owner,academic_manager,teacher')->group(function (): void {
                Route::post('/students/{student}/progress-reports', [StudentProgressReportController::class, 'store'])
                    ->name('students.progress-reports.store');
                Route::post('/students/{student}/academic-risks', [AcademicRiskController::class, 'store'])
                    ->name('students.academic-risks.store');
                Route::patch('/academic-risks/{academicRisk}', [AcademicRiskController::class, 'update'])
                    ->name('academic-risks.update');
                Route::post('/academic-risks/{academicRisk}/interventions', [AcademicRiskController::class, 'storeIntervention'])
                    ->name('academic-risks.interventions.store');
                Route::patch('/academic-interventions/{academicIntervention}', [AcademicRiskController::class, 'updateIntervention'])
                    ->name('academic-interventions.update');
            });
            Route::post('/progress-reports/{studentProgressReport}/publish', [StudentProgressReportController::class, 'publish'])
                ->middleware('role:owner,academic_manager')
                ->name('progress-reports.publish');

            Route::prefix('billing')
                ->middleware('role:owner,staff,admissions,academic_manager,accountant')
                ->name('billing.')
                ->group(function (): void {
                    Route::get('/subscriptions', [SubscriptionController::class, 'index'])
                        ->name('subscriptions.index');
                    Route::post('/subscriptions', [SubscriptionController::class, 'store'])
                        ->name('subscriptions.store');
                    Route::patch('/subscriptions/{studentSubscription}/status', [SubscriptionController::class, 'updateStatus'])
                        ->name('subscriptions.status.update');
                    Route::post('/subscriptions/{studentSubscription}/renew', [SubscriptionController::class, 'renew'])
                        ->name('subscriptions.renew');
                    Route::post('/packages', [StudyPackageController::class, 'store'])
                        ->middleware('role:owner,academic_manager')
                        ->name('packages.store');
                });

            Route::prefix('finance')
                ->middleware('role:owner,accountant')
                ->name('finance.')
                ->group(function (): void {
                    Route::get('/summary', FinanceSummaryController::class)->name('summary');
                    Route::get('/invoices', [InvoiceController::class, 'index'])->name('invoices.index');
                    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
                    Route::post('/invoices/{invoice}/payments', [PaymentController::class, 'store'])
                        ->name('invoices.payments.store');
                    Route::get('/expenses', [ExpenseController::class, 'index'])->name('expenses.index');
                    Route::post('/expenses', [ExpenseController::class, 'store'])->name('expenses.store');
                    Route::patch('/expenses/{expense}/status', [ExpenseController::class, 'updateStatus'])
                        ->name('expenses.status.update');
                    Route::get('/payroll', PayrollController::class)->name('payroll.index');
                    Route::patch('/teacher-earnings/{teacherEarning}/status', [TeacherEarningController::class, 'updateStatus'])
                        ->name('teacher-earnings.status.update');
                });

            Route::middleware('role:owner,staff,admissions,academic_manager')->group(function (): void {
                Route::get('/leads', [LeadController::class, 'index'])->name('leads.index');
                Route::post('/leads', [LeadController::class, 'store'])->name('leads.store');
                Route::get('/leads/{lead}', [LeadController::class, 'show'])->name('leads.show');
                Route::patch('/leads/{lead}', [LeadController::class, 'update'])->name('leads.update');

                Route::post('/leads/{lead}/activities', [LeadActivityController::class, 'store'])
                    ->name('leads.activities.store');
                Route::post('/leads/{lead}/follow-ups', [FollowUpController::class, 'store'])
                    ->name('leads.follow-ups.store');
                Route::put('/leads/{lead}/placement-assessment', [PlacementAssessmentController::class, 'update'])
                    ->name('leads.placement-assessment.update');
                Route::post('/leads/{lead}/convert', [LeadConversionController::class, 'store'])
                    ->name('leads.convert');

                Route::get('/admissions', [AdmissionPipelineController::class, 'index'])
                    ->name('admissions.index');
                Route::post('/leads/{lead}/offers', [AdmissionPipelineController::class, 'storeOffer'])
                    ->name('leads.offers.store');
                Route::post('/offers/{enrollmentOffer}/send', [AdmissionPipelineController::class, 'sendOffer'])
                    ->name('offers.send');
                Route::post('/offers/{enrollmentOffer}/accept', [AdmissionPipelineController::class, 'acceptOffer'])
                    ->name('offers.accept');
                Route::post('/offers/{enrollmentOffer}/decline', [AdmissionPipelineController::class, 'declineOffer'])
                    ->name('offers.decline');
                Route::post('/leads/{lead}/trials', [AdmissionPipelineController::class, 'storeTrial'])
                    ->name('leads.trials.store');
                Route::patch('/trials/{trialBooking}', [AdmissionPipelineController::class, 'updateTrial'])
                    ->name('trials.update');
                Route::post('/leads/{lead}/seat', [AdmissionPipelineController::class, 'storeSeat'])
                    ->name('leads.seat.store');
                Route::post('/waitlist/{waitlistEntry}/promote', [AdmissionPipelineController::class, 'promoteWaitlist'])
                    ->name('waitlist.promote');
                Route::post('/seat-reservations/{seatReservation}/release', [AdmissionPipelineController::class, 'releaseReservation'])
                    ->name('seat-reservations.release');

                Route::get('/follow-ups', [FollowUpController::class, 'index'])->name('follow-ups.index');
                Route::patch('/follow-ups/{followUp}', [FollowUpController::class, 'update'])
                    ->name('follow-ups.update');

                Route::get('/messages', [MessageController::class, 'index'])->name('messages.index');
                Route::post('/messages', [MessageController::class, 'store'])->name('messages.store');
                Route::get('/guardians', [GuardianController::class, 'index'])->name('guardians.index');
                Route::get('/message-templates', [MessageTemplateController::class, 'index'])
                    ->name('message-templates.index');
                Route::get('/service-requests', [FamilyServiceRequestController::class, 'index'])
                    ->name('service-requests.index');
                Route::patch('/service-requests/{familyServiceRequest}', [FamilyServiceRequestController::class, 'update'])
                    ->name('service-requests.update');
            });

            Route::prefix('teacher')->middleware('role:teacher')->name('teacher.')->group(function (): void {
                Route::get('/today', TeacherTodayController::class)->name('today');
                Route::get('/earnings', TeacherEarningsController::class)->name('earnings');
            });

            Route::prefix('family')->middleware('role:guardian')->name('family.')->group(function (): void {
                Route::get('/home', FamilyHomeController::class)->name('home');
                Route::post('/service-requests', [FamilyServiceRequestController::class, 'store'])
                    ->name('service-requests.store');
            });
        });
    });
});
