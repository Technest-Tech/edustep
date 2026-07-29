"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { apiClient } from "@/lib/api/client";
import type {
  AcademicCatalogData,
  ApiCollection,
  ApiItem,
  Cohort,
  Level,
  Program,
} from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeDollarSign,
  BookOpenCheck,
  CheckCircle2,
  CircleAlert,
  Clock3,
  GraduationCap,
  Layers3,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  UsersRound,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

const formatMoney = (value: string | number | null | undefined) =>
  value === null || value === undefined
    ? "—"
    : `${Number(value).toLocaleString("ar-EG")} ج.م`;

export function LevelsContent() {
  const catalogQuery = useQuery({
    queryKey: ["academic-catalog"],
    queryFn: () => apiClient<ApiItem<AcademicCatalogData>>("/api/v1/academic-catalog"),
  });
  const cohortsQuery = useQuery({
    queryKey: ["cohorts", "all-for-levels"],
    queryFn: () => apiClient<ApiCollection<Cohort>>("/api/v1/cohorts"),
  });
  const data = catalogQuery.data?.data;
  const programs = useMemo(() => data?.programs ?? [], [data?.programs]);
  const cohorts = cohortsQuery.data?.data ?? [];
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState("");

  const selectedProgram =
    programs.find((program) => program.id === selectedProgramId) ?? programs[0];

  const selectedLevel =
    selectedProgram?.levels?.find((level) => level.id === selectedLevelId) ??
    selectedProgram?.levels?.[0];
  const levelsCount = programs.reduce(
    (total, program) => total + (program.levels?.length ?? 0),
    0,
  );
  const unitsCount = useMemo(() => {
    const stageIds = new Set<string>();
    let count = 0;

    for (const program of programs) {
      for (const level of program.levels ?? []) {
        if (level.curriculum && !stageIds.has(level.curriculum.id)) {
          stageIds.add(level.curriculum.id);
          count += level.curriculum.units.length;
        }
      }
    }

    return count;
  }, [programs]);

  const loading = catalogQuery.isLoading || cohortsQuery.isLoading;
  const failed = catalogQuery.isError || cohortsQuery.isError;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academic Catalog · المنهج المكثف المعتمد"
        title="المستويات والمناهج"
        description="المسارات الرسمية للأكاديمية من 4 سنوات حتى الكبار، مع المدة والحصص والأسعار ومحتوى كل مستوى."
        actions={
          <Button
            variant="secondary"
            onClick={() => Promise.all([catalogQuery.refetch(), cohortsQuery.refetch()])}
          >
            <RefreshCw
              size={16}
              className={catalogQuery.isFetching || cohortsQuery.isFetching ? "animate-spin" : ""}
            />
            تحديث البيانات
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CatalogMetric icon={Route} label="المسارات العمرية" value={programs.length} />
        <CatalogMetric icon={Layers3} label="المستويات المعتمدة" value={levelsCount} />
        <CatalogMetric icon={BookOpenCheck} label="وحدات المنهج" value={unitsCount} />
        <CatalogMetric
          icon={TimerReset}
          label="مدة المستوى المكثف"
          value={`${data?.policy.duration_weeks ?? 8} أسابيع`}
        />
      </section>

      {loading ? (
        <div className="grid animate-pulse gap-5 xl:grid-cols-[320px_1fr]">
          <div className="h-[560px] rounded-3xl bg-white" />
          <div className="h-[560px] rounded-3xl bg-white" />
        </div>
      ) : failed || !selectedProgram || !selectedLevel ? (
        <div className="grid min-h-72 place-items-center rounded-3xl border border-rose-100 bg-white p-8 text-center">
          <div>
            <CircleAlert className="mx-auto text-rose-500" size={30} />
            <p className="mt-3 text-sm font-semibold text-navy">تعذر تحميل المنهج المعتمد</p>
            <Button className="mt-4" variant="secondary" onClick={() => catalogQuery.refetch()}>
              إعادة المحاولة
            </Button>
          </div>
        </div>
      ) : (
        <>
          <PolicyStrip data={data} />

          <section className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
            <ProgramNavigator
              programs={programs}
              selectedProgram={selectedProgram}
              selectedLevel={selectedLevel}
              cohorts={cohorts}
              onProgramChange={(program) => {
                setSelectedProgramId(program.id);
                setSelectedLevelId(program.levels?.[0]?.id ?? "");
              }}
              onLevelChange={setSelectedLevelId}
            />
            <LevelWorkspace
              program={selectedProgram}
              level={selectedLevel}
              cohorts={cohorts.filter((cohort) => cohort.level.id === selectedLevel.id)}
            />
          </section>
        </>
      )}
    </div>
  );
}

function PolicyStrip({ data }: { data: AcademicCatalogData | undefined }) {
  const policy = data?.policy;

  return (
    <section className="overflow-hidden rounded-3xl bg-navy text-white shadow-[0_18px_55px_rgba(11,36,84,.14)]">
      <div className="grid gap-px bg-white/10 md:grid-cols-4">
        <PolicyItem
          icon={Clock3}
          label="طريقة الدراسة"
          value={`${policy?.sessions_count ?? 16} حصة · ${policy?.sessions_per_week ?? 2} أسبوعيًا`}
        />
        <PolicyItem
          icon={BadgeDollarSign}
          label="طريقة الدفع"
          value={`${policy?.default_installments ?? 2} دفعات أو خصم ${policy?.full_payment_discount_percent ?? 5}% للكامل`}
        />
        <PolicyItem
          icon={Target}
          label="شرط النجاح"
          value={`${policy?.promotion_score_percent ?? 70}% تقييم · ${policy?.promotion_attendance_percent ?? 80}% حضور`}
        />
        <PolicyItem
          icon={Sparkles}
          label="شكل المنهج"
          value={`${policy?.teaching_blocks_count ?? 4} وحدات تشغيلية في المستوى`}
        />
      </div>
    </section>
  );
}

function PolicyItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-navy px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-white/10 text-teal-bright">
          <Icon size={18} />
        </span>
        <div>
          <p className="text-[11px] text-white/55">{label}</p>
          <p className="mt-1 text-sm font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ProgramNavigator({
  programs,
  selectedProgram,
  selectedLevel,
  cohorts,
  onProgramChange,
  onLevelChange,
}: {
  programs: Program[];
  selectedProgram: Program;
  selectedLevel: Level;
  cohorts: Cohort[];
  onProgramChange: (program: Program) => void;
  onLevelChange: (levelId: string) => void;
}) {
  return (
    <aside className="rounded-3xl border border-navy/[0.07] bg-white p-4 shadow-[0_12px_42px_rgba(11,36,84,.05)]">
      <p className="px-1 text-xs font-bold text-navy">اختار المسار العمري</p>
      <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-1">
        {programs.map((program) => {
          const active = program.id === selectedProgram.id;

          return (
            <button
              key={program.id}
              type="button"
              onClick={() => onProgramChange(program)}
              className={`rounded-2xl border p-3 text-right transition ${
                active
                  ? "border-navy bg-navy text-white shadow-lg"
                  : "border-navy/[0.07] bg-cloud/45 text-navy hover:border-teal/30 hover:bg-mist/55"
              }`}
            >
              <span className="block text-sm font-bold">{program.name_ar}</span>
              <span className={`mt-1 block text-[11px] ${active ? "text-white/55" : "text-slate"}`}>
                {program.levels?.length ?? 0} مستويات · {program.session_duration_minutes} دقيقة
              </span>
            </button>
          );
        })}
      </div>

      <div className="my-5 h-px bg-navy/[0.07]" />
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-bold text-navy">اختار المستوى</p>
        <span className="text-[11px] text-slate">{selectedProgram.levels?.length ?? 0} مستوى</span>
      </div>
      <div className="mt-3 max-h-[480px] space-y-2 overflow-y-auto pe-1">
        {selectedProgram.levels?.map((level, index) => {
          const active = level.id === selectedLevel.id;
          const levelCohorts = cohorts.filter((cohort) => cohort.level.id === level.id);

          return (
            <button
              key={level.id}
              type="button"
              onClick={() => onLevelChange(level.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-right transition ${
                active
                  ? "border-teal/35 bg-mist"
                  : "border-navy/[0.055] hover:border-teal/25 hover:bg-cloud"
              }`}
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-xl text-xs font-bold ${
                  active ? "bg-teal text-white" : "bg-cloud text-navy"
                }`}
              >
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-ink">{level.name_ar}</span>
                  {level.is_optional ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-700">
                      اختياري
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-[11px] text-slate">
                  {level.code} · {level.cefr_reference} · {levelCohorts.length} جروب
                </span>
              </span>
              {active ? <CheckCircle2 size={17} className="text-teal" /> : null}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function LevelWorkspace({
  program,
  level,
  cohorts,
}: {
  program: Program;
  level: Level;
  cohorts: Cohort[];
}) {
  const activeStudents = cohorts.reduce((total, cohort) => total + cohort.enrolled_count, 0);
  const fullPaymentPrice =
    level.default_package?.full_payment_price ??
    (level.launch_price
      ? String(
          Number(level.launch_price) *
            (1 - Number(program.full_payment_discount_percent ?? 0) / 100),
        )
      : null);

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-navy/[0.07] bg-white p-5 shadow-[0_12px_42px_rgba(11,36,84,.05)] sm:p-6">
        <div className="absolute -left-12 -top-12 size-44 rounded-full bg-teal/7 blur-2xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-navy px-3 py-1 text-[11px] font-bold text-white">
                {level.code}
              </span>
              <span className="rounded-full bg-mist px-3 py-1 text-[11px] font-semibold text-teal">
                CEFR · {level.cefr_reference}
              </span>
              <span className="rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-slate">
                {program.name_ar}
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-navy sm:text-3xl">{level.name_ar}</h2>
            <p className="mt-1 text-sm text-slate">{level.name_en}</p>
            <p className="mt-5 text-sm leading-7 text-ink">
              <strong className="text-navy">الطالب بعد المستوى يقدر:</strong>{" "}
              {level.outcome ?? "يحقق مخرجات المستوى المعتمدة."}
            </p>
          </div>

          <div className="grid min-w-[260px] grid-cols-2 gap-2">
            <QuickFact label="عدد الحصص" value={`${level.sessions_count} حصة`} />
            <QuickFact label="مدة المستوى" value={`${level.duration_weeks} أسابيع`} />
            <QuickFact label="مدة الحصة" value={`${level.session_duration_minutes} دقيقة`} />
            <QuickFact label="الجروبات الحالية" value={`${cohorts.length} جروب`} />
          </div>
        </div>

        <div className="relative mt-5 grid gap-3 border-t border-navy/[0.06] pt-5 md:grid-cols-3">
          <InfoCard
            icon={Target}
            title="يدخل المستوى إزاي؟"
            value={level.entry_rule ?? "بعد تحديد المستوى واعتماد المقيم."}
          />
          <InfoCard
            icon={UsersRound}
            title="حجم الجروب"
            value={`يبدأ من ${level.minimum_group_size} طلاب، والحد الأقصى ${level.maximum_group_size}.`}
          />
          <InfoCard
            icon={GraduationCap}
            title="التشغيل الحالي"
            value={`${activeStudents} طالب داخل ${cohorts.length} جروب مرتبط بالمستوى.`}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <PriceCard
          label="سعر الإطلاق"
          value={formatMoney(level.launch_price)}
          note="سعر المستوى الكامل لمدة 8 أسابيع"
          accent
        />
        <PriceCard
          label="الدفع على دفعتين"
          value={`${formatMoney(level.default_package?.default_installment_amount)} × 2`}
          note={`الثانية قبل الحصة ${level.default_package?.second_installment_session ?? 9} بـ ${level.default_package?.second_installment_due_days_before ?? 2} يوم`}
        />
        <PriceCard
          label="الدفع الكامل"
          value={formatMoney(fullPaymentPrice)}
          note={`بعد خصم ${program.full_payment_discount_percent ?? 5}%`}
        />
        <PriceCard
          label="فردي One-to-One"
          value={formatMoney(level.one_to_one_price)}
          note="سعر المستوى الفردي المقترح"
        />
      </section>

      <CurriculumSection level={level} />
    </div>
  );
}

function CurriculumSection({ level }: { level: Level }) {
  const units = level.curriculum?.units ?? [];

  return (
    <section className="rounded-3xl border border-navy/[0.07] bg-white p-5 shadow-[0_12px_42px_rgba(11,36,84,.05)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal">
            Curriculum map
          </p>
          <h3 className="mt-2 text-xl font-bold text-navy">محتوى المستوى</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate">
            دي موضوعات المنهج الأساسية. في النظام المكثف بنجمعها داخل 4 وحدات تشغيلية،
            وكل وحدة فيها: تقديم، تدريب، استخدام، ثم مراجعة وتقييم.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-2xl bg-mist px-4 py-2 text-xs font-semibold text-teal">
          <BookOpenCheck size={16} />
          {units.length || "—"} موضوعات منهجية
        </span>
      </div>

      {units.length ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {units.map((unit) => (
            <article
              key={unit.id}
              className="group rounded-2xl border border-navy/[0.06] bg-cloud/35 p-4 transition hover:border-teal/25 hover:bg-white hover:shadow-lg"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-navy text-sm font-bold text-white">
                  {unit.unit_number}
                </span>
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-navy">{unit.theme}</h4>
                  <p className="mt-2 text-sm leading-6 text-ink">{unit.can_do_outcome}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 border-t border-navy/[0.06] pt-3 sm:grid-cols-2">
                <UnitDetail label="مهمة الطالب" value={unit.performance_task} />
                <UnitDetail label="التأكد من الفهم" value={unit.unit_check} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">مستوى تمهيدي اختياري</p>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            K0 يُستخدم فقط لو اختبار المستوى كشف احتياجًا في الحروف أو الأصوات أو روتين
            التعلم، وبعده ينتقل الطالب إلى K1.
          </p>
        </div>
      )}

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-emerald-600" />
        <p className="text-sm leading-6 text-emerald-900">
          الترقية للمستوى التالي تحتاج مجموع 70% أو أكثر، حضور 80% أو أكثر، وعدم وجود
          مهارة أساسية في درجة «يحتاج دعم».
        </p>
      </div>
    </section>
  );
}

function CatalogMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Route;
  label: string;
  value: ReactNode;
}) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-navy/[0.065] bg-white p-4 shadow-[0_8px_26px_rgba(11,36,84,.03)]">
      <div className="grid size-11 place-items-center rounded-2xl bg-mist text-teal">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xl font-bold text-navy">{value}</p>
        <p className="mt-1 text-xs text-slate">{label}</p>
      </div>
    </article>
  );
}

function QuickFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-navy/[0.06] bg-cloud/45 p-3">
      <p className="text-[11px] text-slate">{label}</p>
      <p className="mt-1 text-sm font-bold text-navy">{value}</p>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof Target;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-cloud/45 p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-teal">
        <Icon size={17} />
      </span>
      <div>
        <p className="text-xs font-bold text-navy">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate">{value}</p>
      </div>
    </div>
  );
}

function PriceCard({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-4 ${
        accent
          ? "border-navy bg-navy text-white shadow-[0_14px_34px_rgba(11,36,84,.15)]"
          : "border-navy/[0.065] bg-white"
      }`}
    >
      <p className={`text-xs ${accent ? "text-white/55" : "text-slate"}`}>{label}</p>
      <p className={`mt-2 text-xl font-bold ${accent ? "text-white" : "text-navy"}`}>{value}</p>
      <p className={`mt-2 text-[11px] leading-5 ${accent ? "text-white/55" : "text-slate"}`}>
        {note}
      </p>
    </article>
  );
}

function UnitDetail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-teal">{label}</p>
      <p className="mt-1 text-xs leading-5 text-slate">{value ?? "يحددها المعلم في خطة الحصة."}</p>
    </div>
  );
}
