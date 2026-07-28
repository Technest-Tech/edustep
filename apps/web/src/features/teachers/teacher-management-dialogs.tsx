"use client";

import { Button } from "@/components/ui/button";
import { apiClient, ApiError } from "@/lib/api/client";
import type { ApiCollection, ApiItem, Cohort, Teacher } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleAlert,
  Coins,
  KeyRound,
  Link2,
  LoaderCircle,
  Search,
  ShieldCheck,
  UserPlus,
  UserRoundCog,
  X,
} from "lucide-react";
import { Dialog } from "radix-ui";
import { useMemo, useState, type ReactElement } from "react";

const days = [
  ["saturday", "السبت"],
  ["sunday", "الأحد"],
  ["monday", "الإثنين"],
  ["tuesday", "الثلاثاء"],
  ["wednesday", "الأربعاء"],
  ["thursday", "الخميس"],
  ["friday", "الجمعة"],
] as const;

const manageableCohortStatuses = new Set(["planned", "enrolling", "active"]);

type TeacherForm = {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  employmentType: "full_time" | "part_time";
  status: "active" | "suspended";
  rateType: "hourly" | "fixed_session";
  rateAmount: string;
  availability: string[];
  bio: string;
  password: string;
  passwordConfirmation: string;
};

function initialTeacherForm(teacher: Teacher | null): TeacherForm {
  return {
    name: teacher?.name ?? "",
    email: teacher?.email ?? "",
    phone: teacher?.phone ?? "",
    specialization: teacher?.specialization ?? "",
    employmentType:
      teacher?.employment_type === "full_time" ? "full_time" : "part_time",
    status: teacher?.status === "suspended" ? "suspended" : "active",
    rateType: teacher?.current_rate?.type ?? "hourly",
    rateAmount: teacher?.current_rate?.amount ?? teacher?.hourly_rate ?? "",
    availability:
      teacher?.availability ?? [
        "saturday",
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
      ],
    bio: teacher?.bio ?? "",
    password: "",
    passwordConfirmation: "",
  };
}

export function TeacherEditorDialog({
  open,
  teacher,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  teacher: Teacher | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (teacher: Teacher) => void;
}) {
  const queryClient = useQueryClient();
  const editing = Boolean(teacher);
  const [form, setForm] = useState<TeacherForm>(() => initialTeacherForm(teacher));
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        specialization: form.specialization || null,
        employment_type: form.employmentType,
        status: form.status,
        rate_type: form.rateType,
        rate_amount: Number(form.rateAmount),
        availability: form.availability,
        bio: form.bio || null,
      };

      if (!editing || form.password) {
        payload.password = form.password;
        payload.password_confirmation = form.passwordConfirmation;
      }

      return apiClient<ApiItem<Teacher>>(
        editing ? `/api/v1/teachers/${teacher!.id}` : "/api/v1/teachers",
        {
          method: editing ? "PATCH" : "POST",
          json: payload,
        },
      );
    },
    onSuccess: async (response) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["teachers"] }),
        queryClient.invalidateQueries({ queryKey: ["cohorts"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["payroll"] }),
      ]);
      setError(null);
      onSaved(response.data);
      onOpenChange(false);
    },
    onError: (value) => setError(errorMessage(value, "تعذر حفظ بيانات المعلم.")),
  });

  function update<Key extends keyof TeacherForm>(key: Key, value: TeacherForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleDay(day: string) {
    setForm((current) => ({
      ...current,
      availability: current.availability.includes(day)
        ? current.availability.filter((item) => item !== day)
        : [...current.availability, day],
    }));
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!mutation.isPending) onOpenChange(value);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/35 backdrop-blur-[2px]" />
        <Dialog.Content
          dir="rtl"
          className="fixed inset-y-0 left-0 z-50 w-full max-w-[680px] overflow-y-auto border-r border-navy/[0.08] bg-white p-5 shadow-2xl sm:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy text-white">
                {editing ? <UserRoundCog size={20} /> : <UserPlus size={20} />}
              </span>
              <div>
                <Dialog.Title className="text-lg font-bold text-navy">
                  {editing ? `إدارة ${teacher?.name}` : "إضافة معلم جديد"}
                </Dialog.Title>
                <Dialog.Description className="mt-1 max-w-lg text-[11px] leading-5 text-slate">
                  {editing
                    ? "حدّث الملف المهني، التوفر، قاعدة المستحقات وحساب الدخول من مكان واحد."
                    : "أنشئ ملف المعلم وحساب دخوله وحدد التوفر وطريقة احتساب المستحقات."}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <Button size="icon" variant="secondary" aria-label="إغلاق">
                <X size={17} />
              </Button>
            </Dialog.Close>
          </div>

          <form
            className="mt-6 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              setError(null);
              mutation.mutate();
            }}
          >
            <FormSection
              icon={UserRoundCog}
              title="البيانات الأساسية"
              description="بيانات التواصل والملف المهني الظاهرة للإدارة."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TeacherField label="الاسم الكامل">
                  <input
                    value={form.name}
                    onChange={(event) => update("name", event.target.value)}
                    required
                  />
                </TeacherField>
                <TeacherField label="التخصص">
                  <input
                    value={form.specialization}
                    onChange={(event) => update("specialization", event.target.value)}
                    placeholder="مثال: محادثة ومناهج الأطفال"
                  />
                </TeacherField>
                <TeacherField label="البريد الإلكتروني">
                  <input
                    dir="ltr"
                    type="email"
                    value={form.email}
                    onChange={(event) => update("email", event.target.value)}
                    required
                  />
                </TeacherField>
                <TeacherField label="رقم الهاتف">
                  <input
                    dir="ltr"
                    value={form.phone}
                    onChange={(event) => update("phone", event.target.value)}
                  />
                </TeacherField>
                <TeacherField label="نظام العمل">
                  <select
                    value={form.employmentType}
                    onChange={(event) =>
                      update(
                        "employmentType",
                        event.target.value as TeacherForm["employmentType"],
                      )
                    }
                  >
                    <option value="part_time">دوام جزئي</option>
                    <option value="full_time">دوام كامل</option>
                  </select>
                </TeacherField>
                <TeacherField label="حالة حساب الدخول">
                  <select
                    value={form.status}
                    onChange={(event) =>
                      update("status", event.target.value as TeacherForm["status"])
                    }
                  >
                    <option value="active">نشط</option>
                    <option value="suspended">موقوف</option>
                  </select>
                </TeacherField>
              </div>
              <TeacherField label="نبذة وملاحظات مهنية">
                <textarea
                  rows={4}
                  value={form.bio}
                  onChange={(event) => update("bio", event.target.value)}
                  placeholder="الخبرة، الفئات المناسبة، نقاط القوة، وأي ملاحظات يحتاجها المدير الأكاديمي."
                />
              </TeacherField>
            </FormSection>

            <FormSection
              icon={CalendarDays}
              title="التوفر الأسبوعي"
              description="يُستخدم عند الإسناد ومراجعة الجداول."
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {days.map(([value, label]) => {
                  const selected = form.availability.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleDay(value)}
                      aria-pressed={selected}
                      className={`flex min-h-11 items-center justify-between rounded-xl border px-3 text-[11px] font-semibold transition ${
                        selected
                          ? "border-teal/35 bg-mist text-navy"
                          : "border-navy/[0.08] bg-cloud/50 text-slate hover:border-teal/25"
                      }`}
                    >
                      {label}
                      <span
                        className={`grid size-5 place-items-center rounded-md ${
                          selected ? "bg-teal text-white" : "bg-white text-transparent"
                        }`}
                      >
                        <Check size={13} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </FormSection>

            <FormSection
              icon={Coins}
              title="قاعدة المستحقات"
              description="تُطبق تلقائيًا على الحصص الجديدة عند اكتمالها."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TeacherField label="طريقة الحساب">
                  <select
                    value={form.rateType}
                    onChange={(event) =>
                      update("rateType", event.target.value as TeacherForm["rateType"])
                    }
                  >
                    <option value="hourly">سعر بالساعة</option>
                    <option value="fixed_session">سعر ثابت للحصة</option>
                  </select>
                </TeacherField>
                <TeacherField
                  label={
                    form.rateType === "hourly" ? "سعر الساعة" : "سعر الحصة"
                  }
                >
                  <input
                    type="number"
                    min="0"
                    max="1000000"
                    step="0.01"
                    value={form.rateAmount}
                    onChange={(event) => update("rateAmount", event.target.value)}
                    required
                  />
                </TeacherField>
              </div>
            </FormSection>

            <FormSection
              icon={ShieldCheck}
              title={editing ? "تحديث كلمة المرور" : "حساب الدخول"}
              description={
                editing
                  ? "اترك الحقلين فارغين للحفاظ على كلمة المرور الحالية."
                  : "يمكن للمعلم تسجيل الدخول مباشرة بكلمة المرور المؤقتة."
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TeacherField label={editing ? "كلمة مرور جديدة" : "كلمة المرور المؤقتة"}>
                  <input
                    dir="ltr"
                    type="password"
                    value={form.password}
                    onChange={(event) => update("password", event.target.value)}
                    required={!editing}
                  />
                </TeacherField>
                <TeacherField label="تأكيد كلمة المرور">
                  <input
                    dir="ltr"
                    type="password"
                    value={form.passwordConfirmation}
                    onChange={(event) =>
                      update("passwordConfirmation", event.target.value)
                    }
                    required={!editing || Boolean(form.password)}
                  />
                </TeacherField>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[10px] leading-5 text-amber-900">
                <KeyRound className="mt-0.5 shrink-0" size={14} />
                10 أحرف على الأقل وتحتوي على حرف كبير وصغير ورقم. لن تظهر كلمة
                المرور في سجل النظام.
              </div>
            </FormSection>

            {error ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-[11px] leading-5 text-rose-700"
              >
                <CircleAlert className="mt-0.5 shrink-0" size={15} />
                {error}
              </p>
            ) : null}

            <div className="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t border-navy/[0.06] bg-white/95 px-5 py-4 backdrop-blur sm:-mx-7 sm:px-7">
              <Dialog.Close asChild>
                <Button variant="secondary" disabled={mutation.isPending}>
                  إلغاء
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <LoaderCircle className="animate-spin" size={15} />
                ) : editing ? (
                  <UserRoundCog size={15} />
                ) : (
                  <UserPlus size={15} />
                )}
                {mutation.isPending
                  ? "جاري الحفظ..."
                  : editing
                    ? "حفظ التعديلات"
                    : "إنشاء المعلم"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function TeacherCohortAssignmentDialog({
  open,
  teacher,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  teacher: Teacher;
  onOpenChange: (open: boolean) => void;
  onSaved: (teacher: Teacher) => void;
}) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState(
    () =>
      new Set(
        teacher.cohorts
          .filter((cohort) => manageableCohortStatuses.has(cohort.status))
          .map((cohort) => cohort.id),
      ),
  );
  const [updateFutureSessions, setUpdateFutureSessions] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const cohortsQuery = useQuery({
    queryKey: ["cohorts", "teacher-assignment"],
    queryFn: () => apiClient<ApiCollection<Cohort>>("/api/v1/cohorts"),
    enabled: open,
  });
  const cohorts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("ar");
    return (cohortsQuery.data?.data ?? [])
      .filter((cohort) => manageableCohortStatuses.has(cohort.status))
      .filter(
        (cohort) =>
          !normalizedSearch ||
          `${cohort.name} ${cohort.code} ${cohort.program.name_ar} ${cohort.level.name_ar}`
            .toLocaleLowerCase("ar")
            .includes(normalizedSearch),
      );
  }, [cohortsQuery.data, search]);
  const mutation = useMutation({
    mutationFn: () =>
      apiClient<ApiItem<Teacher>>(`/api/v1/teachers/${teacher.id}/cohorts`, {
        method: "PUT",
        json: {
          cohort_ids: Array.from(selectedIds),
          update_future_sessions: updateFutureSessions,
        },
      }),
    onSuccess: async (response) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["teachers"] }),
        queryClient.invalidateQueries({ queryKey: ["cohorts"] }),
        queryClient.invalidateQueries({ queryKey: ["calendar"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["teacher"] }),
      ]);
      setError(null);
      onSaved(response.data);
      onOpenChange(false);
    },
    onError: (value) =>
      setError(errorMessage(value, "تعذر تحديث الجروبات المسندة للمعلم.")),
  });

  function toggleCohort(cohortId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(cohortId)) next.delete(cohortId);
      else next.add(cohortId);
      return next;
    });
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!mutation.isPending) onOpenChange(value);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/35 backdrop-blur-[2px]" />
        <Dialog.Content
          dir="rtl"
          className="fixed inset-y-0 left-0 z-50 flex w-full max-w-[640px] flex-col border-r border-navy/[0.08] bg-white p-5 shadow-2xl sm:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-mist text-teal">
                <Link2 size={20} />
              </span>
              <div>
                <Dialog.Title className="text-lg font-bold text-navy">
                  إسناد جروبات {teacher.name}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-[11px] leading-5 text-slate">
                  حدد الجروبات الحالية. اختيار جروب مسند لمعلم آخر سينقله إلى هذا
                  المعلم بعد التحقق من تعارض الحصص.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <Button size="icon" variant="secondary" aria-label="إغلاق">
                <X size={17} />
              </Button>
            </Dialog.Close>
          </div>

          <div className="relative mt-5">
            <Search
              className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-slate"
              size={16}
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث باسم الجروب أو البرنامج أو المستوى..."
              className="min-h-11 w-full rounded-xl border border-navy/[0.09] bg-cloud/70 pr-10 pl-3.5 text-[11px] outline-none transition focus:border-teal"
            />
          </div>

          <div className="thin-scrollbar mt-4 flex-1 overflow-y-auto">
            {cohortsQuery.isLoading ? (
              <div className="grid min-h-48 place-items-center">
                <LoaderCircle className="animate-spin text-teal" size={24} />
              </div>
            ) : cohortsQuery.isError ? (
              <p className="rounded-xl bg-rose-50 p-4 text-center text-[11px] text-rose-700">
                تعذر تحميل الجروبات الحالية.
              </p>
            ) : cohorts.length ? (
              <div className="space-y-2">
                {cohorts.map((cohort) => {
                  const selected = selectedIds.has(cohort.id);
                  const transferred =
                    cohort.teacher && cohort.teacher.id !== teacher.id;
                  return (
                    <button
                      key={cohort.id}
                      type="button"
                      onClick={() => toggleCohort(cohort.id)}
                      aria-pressed={selected}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-right transition ${
                        selected
                          ? "border-teal/35 bg-mist/65"
                          : "border-navy/[0.07] bg-white hover:border-teal/25 hover:bg-cloud/45"
                      }`}
                    >
                      <span
                        className={`grid size-6 shrink-0 place-items-center rounded-lg ${
                          selected
                            ? "bg-teal text-white"
                            : "border border-navy/[0.12] bg-cloud text-transparent"
                        }`}
                      >
                        <Check size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold text-navy">
                          {cohort.name}
                        </span>
                        <span className="mt-1 block truncate text-[10px] text-slate">
                          {cohort.code} · {cohort.program.name_ar} ·{" "}
                          {cohort.level.name_ar} · {cohort.enrolled_count} طلاب
                        </span>
                      </span>
                      <span className="shrink-0 text-left">
                        {transferred ? (
                          <>
                            <span className="block text-[9px] font-semibold text-amber-700">
                              مسند حاليًا
                            </span>
                            <span className="mt-1 block max-w-24 truncate text-[9px] text-slate">
                              {cohort.teacher?.name}
                            </span>
                          </>
                        ) : cohort.teacher?.id === teacher.id ? (
                          <span className="rounded-lg bg-teal/10 px-2 py-1 text-[9px] font-semibold text-teal">
                            مسند له
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate">غير معيّن</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl bg-cloud p-5 text-center text-[11px] text-slate">
                لا توجد جروبات مطابقة وجاهزة للإسناد.
              </p>
            )}
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50/70 p-3.5">
            <input
              type="checkbox"
              checked={updateFutureSessions}
              onChange={(event) => setUpdateFutureSessions(event.target.checked)}
              className="mt-1 size-4 accent-violet-600"
            />
            <span>
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-violet-900">
                <CalendarDays size={14} />
                تحديث الحصص القادمة
              </span>
              <span className="mt-1 block text-[10px] leading-5 text-violet-800">
                يغيّر المعلم في الحصص المجدولة مستقبلًا، مع منع أي تعارض تلقائي.
                الحصص المكتملة وتاريخها لن يتغيرا.
              </span>
            </span>
          </label>

          {error ? (
            <p
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-[11px] leading-5 text-rose-700"
            >
              <CircleAlert className="mt-0.5 shrink-0" size={15} />
              {error}
            </p>
          ) : null}

          <div className="-mx-5 mt-4 flex items-center justify-between border-t border-navy/[0.06] bg-white px-5 pt-4 sm:-mx-7 sm:px-7">
            <span className="text-[10px] text-slate">
              {selectedIds.size} جروبات محددة
            </span>
            <div className="flex gap-2">
              <Dialog.Close asChild>
                <Button variant="secondary" disabled={mutation.isPending}>
                  إلغاء
                </Button>
              </Dialog.Close>
              <Button
                type="button"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || cohortsQuery.isLoading}
              >
                {mutation.isPending ? (
                  <LoaderCircle className="animate-spin" size={15} />
                ) : (
                  <Link2 size={15} />
                )}
                {mutation.isPending ? "جاري الحفظ..." : "حفظ الإسناد"}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof BriefcaseBusiness;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-navy/[0.065] p-4">
      <div className="flex items-start gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-cloud text-teal">
          <Icon size={16} />
        </span>
        <div>
          <h2 className="text-xs font-bold text-navy">{title}</h2>
          <p className="mt-1 text-[10px] leading-5 text-slate">{description}</p>
        </div>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function TeacherField({
  label,
  children,
}: {
  label: string;
  children: ReactElement;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold text-slate">{label}</span>
      <span className="[&>input]:min-h-11 [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-navy/[0.09] [&>input]:bg-cloud/70 [&>input]:px-3.5 [&>input]:text-[11px] [&>input]:outline-none [&>input]:transition [&>input]:focus:border-teal [&>select]:min-h-11 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-navy/[0.09] [&>select]:bg-cloud/70 [&>select]:px-3.5 [&>select]:text-[11px] [&>select]:outline-none [&>select]:transition [&>select]:focus:border-teal [&>textarea]:w-full [&>textarea]:resize-none [&>textarea]:rounded-xl [&>textarea]:border [&>textarea]:border-navy/[0.09] [&>textarea]:bg-cloud/70 [&>textarea]:px-3.5 [&>textarea]:py-3 [&>textarea]:text-[11px] [&>textarea]:leading-5 [&>textarea]:outline-none [&>textarea]:transition [&>textarea]:focus:border-teal">
        {children}
      </span>
    </label>
  );
}

function errorMessage(value: unknown, fallback: string) {
  if (value instanceof ApiError) {
    return Object.values(value.errors)[0]?.[0] ?? value.message;
  }
  return fallback;
}
