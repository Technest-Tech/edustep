<?php

namespace Database\Seeders;

use App\Models\CurriculumStage;
use App\Models\CurriculumUnit;
use App\Models\Level;
use App\Models\Program;
use App\Models\StudyPackage;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AcademicCatalogSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $catalog = $this->catalog();

        DB::transaction(function () use ($catalog): void {
            $stages = collect($catalog['curriculum_stages'])
                ->mapWithKeys(function (array $stage): array {
                    $model = CurriculumStage::query()->updateOrCreate(
                        ['code' => $stage['code']],
                        [
                            'audience' => $stage['audience'],
                            'source_level' => $stage['source_level'],
                            'cefr_reference' => $stage['cefr_reference'],
                            'source_version' => 'academic-v1.0',
                        ],
                    );

                    foreach ($stage['units'] as $unit) {
                        CurriculumUnit::query()->updateOrCreate(
                            [
                                'curriculum_stage_id' => $model->id,
                                'unit_number' => $unit['unit_number'],
                            ],
                            [
                                'theme' => $unit['theme'],
                                'can_do_outcome' => $unit['can_do_outcome'],
                                'target_language' => $unit['target_language'],
                                'lexis' => $unit['lexis'],
                                'pronunciation_focus' => $unit['pronunciation_focus'],
                                'performance_task' => $unit['performance_task'],
                                'unit_check' => $unit['unit_check'],
                            ],
                        );
                    }

                    return [$stage['code'] => $model];
                });

            foreach ($catalog['programs'] as $programData) {
                $program = Program::query()->updateOrCreate(
                    ['code' => $programData['code']],
                    [
                        'name_ar' => $programData['name_ar'],
                        'name_en' => $programData['name_en'],
                        'description' => $programData['description'],
                        'age_min' => $programData['age_min'],
                        'age_max' => $programData['age_max'],
                        'catalog_version' => $catalog['version'],
                        'sessions_per_week' => $programData['sessions_per_week'],
                        'default_duration_weeks' => $programData['duration_weeks'],
                        'default_sessions_count' => $programData['sessions_count'],
                        'session_duration_minutes' => $programData['session_duration_minutes'],
                        'home_practice_minutes_min' => $programData['home_practice_minutes_min'],
                        'home_practice_minutes_max' => $programData['home_practice_minutes_max'],
                        'minimum_group_size' => $programData['minimum_group_size'],
                        'maximum_group_size' => $programData['maximum_group_size'],
                        'launch_price' => $programData['launch_price'],
                        'standard_price' => $programData['standard_price'],
                        'one_to_one_price' => $programData['one_to_one_price'],
                        'full_payment_discount_percent' => $programData['full_payment_discount_percent'],
                        'promotion_score_percent' => $programData['promotion_score_percent'],
                        'promotion_attendance_percent' => $programData['promotion_attendance_percent'],
                        'is_active' => true,
                    ],
                );

                foreach ($programData['levels'] as $levelData) {
                    $stage = $levelData['curriculum_stage_code']
                        ? $stages->get($levelData['curriculum_stage_code'])
                        : null;
                    $level = Level::query()->updateOrCreate(
                        [
                            'program_id' => $program->id,
                            'code' => $levelData['code'],
                        ],
                        [
                            'curriculum_stage_id' => $stage?->id,
                            'name_ar' => $levelData['name_ar'],
                            'name_en' => $levelData['name_en'],
                            'cefr_reference' => $levelData['cefr_reference'],
                            'entry_rule' => $levelData['entry_rule'],
                            'outcome' => $levelData['outcome'],
                            'sessions_count' => $levelData['sessions_count'],
                            'duration_weeks' => $levelData['duration_weeks'],
                            'sessions_per_week' => $levelData['sessions_per_week'],
                            'session_duration_minutes' => $levelData['session_duration_minutes'],
                            'guided_hours' => $levelData['guided_hours'],
                            'launch_price' => $levelData['launch_price'],
                            'standard_price' => $levelData['standard_price'],
                            'one_to_one_price' => $levelData['one_to_one_price'],
                            'minimum_group_size' => $levelData['minimum_group_size'],
                            'maximum_group_size' => $levelData['maximum_group_size'],
                            'default_installments' => $levelData['default_installments'],
                            'is_optional' => $levelData['is_optional'],
                            'catalog_version' => $catalog['version'],
                            'sort_order' => $levelData['sort_order'],
                            'is_active' => true,
                        ],
                    );

                    StudyPackage::query()->updateOrCreate(
                        ['code' => $levelData['package_code']],
                        [
                            'program_id' => $program->id,
                            'level_id' => $level->id,
                            'name' => $levelData['package_name'],
                            'sessions_count' => $levelData['sessions_count'],
                            'duration_weeks' => $levelData['duration_weeks'],
                            'price' => $levelData['launch_price'],
                            'standard_price' => $levelData['standard_price'],
                            'full_payment_discount_percent' => $programData['full_payment_discount_percent'],
                            'default_installments' => $levelData['default_installments'],
                            'second_installment_session' => $programData['second_installment_session'],
                            'second_installment_due_days_before' => $programData['second_installment_due_days_before'],
                            'source_version' => $catalog['version'],
                            'is_active' => true,
                            'description' => sprintf(
                                'المستوى المكثف: %d حصة خلال %d أسابيع، بواقع %d حصة أسبوعيًا.',
                                $levelData['sessions_count'],
                                $levelData['duration_weeks'],
                                $levelData['sessions_per_week'],
                            ),
                        ],
                    );
                }
            }

            Program::query()
                ->where('code', 'GENERAL')
                ->whereNull('catalog_version')
                ->update(['is_active' => false]);

            Level::query()
                ->whereHas('program', fn ($query) => $query->where('code', 'KIDS'))
                ->whereIn('code', ['STARTER', 'A1', 'A2'])
                ->whereNull('catalog_version')
                ->update(['is_active' => false]);

            StudyPackage::query()
                ->whereNull('source_version')
                ->whereIn('code', ['KIDS-A2-16', 'GENERAL-B1-24', 'GENERAL-A1-24'])
                ->update(['is_active' => false]);
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function catalog(): array
    {
        $path = database_path('data/academic_catalog_v1_1.json');

        if (! is_file($path)) {
            throw new RuntimeException("Academic catalog file is missing: {$path}");
        }

        $catalog = json_decode((string) file_get_contents($path), true);

        if (! is_array($catalog) || ($catalog['version'] ?? null) !== 'intensive-v1.1') {
            throw new RuntimeException('Academic catalog file is invalid or has an unexpected version.');
        }

        return $catalog;
    }
}
