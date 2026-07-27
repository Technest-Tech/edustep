"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { apiClient } from "@/lib/api/client";
import type { ApiCollection, Cohort, Program } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  CircleAlert,
  GraduationCap,
  Layers3,
  RefreshCw,
  Route,
  UsersRound,
} from "lucide-react";

export function LevelsContent() {
  const programsQuery = useQuery({
    queryKey: ["programs"],
    queryFn: () => apiClient<ApiCollection<Program>>("/api/v1/programs"),
  });
  const cohortsQuery = useQuery({
    queryKey: ["cohorts", "all-for-levels"],
    queryFn: () => apiClient<ApiCollection<Cohort>>("/api/v1/cohorts"),
  });
  const programs = programsQuery.data?.data ?? [];
  const cohorts = cohortsQuery.data?.data ?? [];
  const levelCount = programs.reduce((sum, program) => sum + (program.levels?.length ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academic Catalog · الهيكل الأكاديمي"
        title="المستويات والمناهج"
        description="مسارات التعلم مرتبة بوضوح، مع ربط كل مستوى بالجروبات المفتوحة والنشطة."
        actions={
          <Button
            variant="secondary"
            onClick={() => Promise.all([programsQuery.refetch(), cohortsQuery.refetch()])}
          >
            <RefreshCw
              size={15}
              className={programsQuery.isFetching || cohortsQuery.isFetching ? "animate-spin" : ""}
            />
            تحديث
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <CatalogMetric icon={Route} label="البرامج التعليمية" value={programs.length} />
        <CatalogMetric icon={Layers3} label="المستويات المتاحة" value={levelCount} />
        <CatalogMetric
          icon={UsersRound}
          label="الجروبات المرتبطة"
          value={cohorts.length}
        />
      </section>

      {programsQuery.isLoading || cohortsQuery.isLoading ? (
        <div className="grid animate-pulse gap-5 xl:grid-cols-2">
          <div className="h-[460px] rounded-2xl bg-white" />
          <div className="h-[460px] rounded-2xl bg-white" />
        </div>
      ) : programsQuery.isError || cohortsQuery.isError ? (
        <div className="grid min-h-72 place-items-center rounded-2xl border border-rose-100 bg-white p-8 text-center">
          <div>
            <CircleAlert className="mx-auto text-rose-500" size={28} />
            <p className="mt-3 text-xs font-semibold text-navy">تعذر تحميل الهيكل الأكاديمي</p>
            <Button className="mt-4" variant="secondary" onClick={() => programsQuery.refetch()}>
              إعادة المحاولة
            </Button>
          </div>
        </div>
      ) : (
        <section className="grid gap-5 xl:grid-cols-2">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} cohorts={cohorts} />
          ))}
        </section>
      )}
    </div>
  );
}

function ProgramCard({ program, cohorts }: { program: Program; cohorts: Cohort[] }) {
  const programCohorts = cohorts.filter((cohort) => cohort.program.id === program.id);

  return (
    <article className="overflow-hidden rounded-2xl border border-navy/[0.065] bg-white shadow-[0_8px_30px_rgba(11,36,84,.035)]">
      <div className="bg-navy p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-[8px] text-sun">
              {program.code}
            </span>
            <h2 className="mt-3 text-base font-bold">{program.name_ar}</h2>
            <p className="mt-1 text-[9px] text-white/50">{program.name_en}</p>
          </div>
          <div className="grid size-11 place-items-center rounded-2xl bg-white/10 text-teal-bright">
            <BookOpenCheck size={21} />
          </div>
        </div>
        <p className="mt-4 max-w-lg text-[9px] leading-5 text-white/60">
          {program.description}
        </p>
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-navy">مسار التدرج</h3>
          <span className="text-[8px] text-slate">{program.levels?.length ?? 0} مستويات</span>
        </div>

        <div className="space-y-2">
          {program.levels?.map((level, index) => {
            const levelCohorts = programCohorts.filter((cohort) => cohort.level.id === level.id);
            const activeStudents = levelCohorts.reduce(
              (sum, cohort) => sum + cohort.enrolled_count,
              0,
            );

            return (
              <div key={level.id} className="relative flex items-center gap-3">
                {index < (program.levels?.length ?? 0) - 1 ? (
                  <span className="absolute right-[17px] top-9 h-5 w-px bg-teal/20" />
                ) : null}
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-mist text-[9px] font-bold text-navy">
                  {index + 1}
                </div>
                <div className="flex min-w-0 flex-1 items-center justify-between rounded-xl border border-navy/[0.055] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-semibold text-ink">{level.name_ar}</p>
                    <p className="mt-1 text-[8px] text-slate">
                      {level.code} · {levelCohorts.length} جروبات
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden text-[8px] text-slate sm:inline">
                      {activeStudents} طلاب
                    </span>
                    {level.is_active ? (
                      <CheckCircle2 size={15} className="text-emerald-500" />
                    ) : (
                      <CircleAlert size={15} className="text-slate" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl bg-cloud p-3">
          <div className="flex items-center gap-2">
            <GraduationCap size={16} className="text-teal" />
            <span className="text-[9px] font-medium text-navy">
              {programCohorts.reduce((sum, cohort) => sum + cohort.enrolled_count, 0)} طالب
            </span>
          </div>
          <span className="flex items-center gap-1 text-[8px] text-slate">
            {programCohorts.length} جروبات
            <ArrowLeft size={12} />
          </span>
        </div>
      </div>
    </article>
  );
}

function CatalogMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Route;
  label: string;
  value: number;
}) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-navy/[0.065] bg-white p-4 shadow-[0_8px_26px_rgba(11,36,84,.03)]">
      <div className="grid size-11 place-items-center rounded-2xl bg-mist text-teal">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xl font-bold text-navy">{value}</p>
        <p className="mt-1 text-[9px] text-slate">{label}</p>
      </div>
    </article>
  );
}
