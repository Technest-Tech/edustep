"use client";

import { Button } from "@/components/ui/button";
import { apiClient, ApiError } from "@/lib/api/client";
import type {
  ApiCollection,
  ApiItem,
  Cohort,
  Program,
  Teacher,
} from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
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

type GroupForm = {
  name: string;
  code: string;
  programId: string;
  levelId: string;
  teacherId: string;
  status: string;
  deliveryMode: string;
  capacity: string;
  fee: string;
  startsOn: string;
  endsOn: string;
  firstDay: string;
  firstTime: string;
  secondDay: string;
  secondTime: string;
  location: string;
};

const initialForm: GroupForm = {
  name: "",
  code: "",
  programId: "",
  levelId: "",
  teacherId: "",
  status: "enrolling",
  deliveryMode: "online",
  capacity: "12",
  fee: "",
  startsOn: "",
  endsOn: "",
  firstDay: "sunday",
  firstTime: "18:00",
  secondDay: "wednesday",
  secondTime: "18:00",
  location: "",
};

export function AddGroupDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<GroupForm>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const programsQuery = useQuery({
    queryKey: ["programs"],
    queryFn: () => apiClient<ApiCollection<Program>>("/api/v1/programs"),
    enabled: open,
  });
  const teachersQuery = useQuery({
    queryKey: ["teachers"],
    queryFn: () => apiClient<ApiCollection<Teacher>>("/api/v1/teachers"),
    enabled: open,
  });
  const selectedProgram = useMemo(
    () => programsQuery.data?.data.find((program) => program.id === form.programId),
    [form.programId, programsQuery.data],
  );
  const selectedLevel = useMemo(
    () => selectedProgram?.levels?.find((level) => level.id === form.levelId),
    [form.levelId, selectedProgram],
  );
  const mutation = useMutation({
    mutationFn: () =>
      apiClient<ApiItem<Cohort>>("/api/v1/cohorts", {
        method: "POST",
        json: {
          program_id: form.programId,
          level_id: form.levelId,
          study_package_id: selectedLevel?.default_package?.id ?? null,
          teacher_id: form.teacherId || null,
          code: form.code.toUpperCase(),
          name: form.name,
          status: form.status,
          delivery_mode: form.deliveryMode,
          capacity: Number(form.capacity),
          fee: Number(form.fee),
          starts_on: form.startsOn || null,
          ends_on: form.endsOn || null,
          schedule: [
            { day: form.firstDay, time: form.firstTime },
            { day: form.secondDay, time: form.secondTime },
          ],
          meeting_url: form.deliveryMode === "online" ? form.location || null : null,
          room_name: form.deliveryMode !== "online" ? form.location || null : null,
        },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cohorts"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      setForm(initialForm);
      setError(null);
      onOpenChange(false);
    },
    onError: (value) => {
      if (value instanceof ApiError) {
        setError(Object.values(value.errors)[0]?.[0] ?? value.message);
      } else {
        setError("تعذر إنشاء الجروب. حاول مرة أخرى.");
      }
    },
  });

  function update<Key extends keyof GroupForm>(key: Key, value: GroupForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/35 backdrop-blur-[2px]" />
        <Dialog.Content
          dir="rtl"
          className="fixed inset-y-0 left-0 z-50 w-full max-w-[620px] overflow-y-auto border-r border-navy/[0.08] bg-white p-5 shadow-2xl sm:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-bold text-navy">إنشاء جروب جديد</Dialog.Title>
              <Dialog.Description className="mt-1 max-w-md text-[12px] leading-5 text-slate">
                حدد البرنامج والمستوى والسعة والمواعيد. يمكن بدء التسجيل قبل تعيين المعلم.
              </Dialog.Description>
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
            <section className="rounded-2xl border border-navy/[0.065] p-4">
              <h2 className="text-[12px] font-bold text-navy">البيانات الأساسية</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <GroupField label="اسم الجروب">
                  <input
                    value={form.name}
                    onChange={(event) => update("name", event.target.value)}
                    placeholder="مثال: Adults A1 · المجموعة A-22"
                    required
                  />
                </GroupField>
                <GroupField label="كود الجروب">
                  <input
                    dir="ltr"
                    value={form.code}
                    onChange={(event) => update("code", event.target.value)}
                    placeholder="A-22"
                    required
                  />
                </GroupField>
                <GroupField label="البرنامج">
                  <select
                    value={form.programId}
                    onChange={(event) => {
                      update("programId", event.target.value);
                      update("levelId", "");
                      update("fee", "");
                    }}
                    required
                  >
                    <option value="">اختر البرنامج</option>
                    {programsQuery.data?.data.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name_ar}
                      </option>
                    ))}
                  </select>
                </GroupField>
                <GroupField label="المستوى">
                  <select
                    value={form.levelId}
                    onChange={(event) => {
                      const value = event.target.value;
                      const level = selectedProgram?.levels?.find((item) => item.id === value);
                      update("levelId", value);
                      update("capacity", String(level?.maximum_group_size ?? 12));
                      update("fee", level?.launch_price ?? "");

                      if (form.startsOn && level?.duration_weeks) {
                        update("endsOn", suggestedEndDate(form.startsOn, level.duration_weeks));
                      }
                    }}
                    disabled={!selectedProgram}
                    required
                  >
                    <option value="">اختر المستوى</option>
                    {selectedProgram?.levels?.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name_ar}
                      </option>
                    ))}
                  </select>
                </GroupField>
                <GroupField label="الحالة">
                  <select
                    value={form.status}
                    onChange={(event) => update("status", event.target.value)}
                  >
                    <option value="planned">مخطط</option>
                    <option value="enrolling">متاح التسجيل</option>
                    <option value="active">نشط</option>
                  </select>
                </GroupField>
                <GroupField label="المعلم">
                  <select
                    value={form.teacherId}
                    onChange={(event) => update("teacherId", event.target.value)}
                  >
                    <option value="">يعيّن لاحقًا</option>
                    {teachersQuery.data?.data.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </GroupField>
              </div>
            </section>

            <section className="rounded-2xl border border-navy/[0.065] p-4">
              <h2 className="text-[12px] font-bold text-navy">التشغيل والرسوم</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <GroupField label="نظام الدراسة">
                  <select
                    value={form.deliveryMode}
                    onChange={(event) => update("deliveryMode", event.target.value)}
                  >
                    <option value="online">أونلاين</option>
                    <option value="onsite">حضوري</option>
                    <option value="hybrid">هجين</option>
                  </select>
                </GroupField>
                <GroupField label="السعة">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={form.capacity}
                    onChange={(event) => update("capacity", event.target.value)}
                    required
                  />
                </GroupField>
                <GroupField label="رسوم الطالب">
                  <input
                    type="number"
                    min="0"
                    value={form.fee}
                    onChange={(event) => update("fee", event.target.value)}
                    required
                  />
                </GroupField>
                <GroupField
                  label={form.deliveryMode === "online" ? "رابط الاجتماع" : "الفرع أو القاعة"}
                >
                  <input
                    type={form.deliveryMode === "online" ? "url" : "text"}
                    value={form.location}
                    onChange={(event) => update("location", event.target.value)}
                    placeholder={
                      form.deliveryMode === "online"
                        ? "https://meet.google.com/..."
                        : "فرع المعادي · قاعة 1"
                    }
                  />
                </GroupField>
                <GroupField label="تاريخ البداية">
                  <input
                    type="date"
                    value={form.startsOn}
                    onChange={(event) => {
                      const value = event.target.value;
                      update("startsOn", value);
                      if (value && selectedLevel?.duration_weeks) {
                        update("endsOn", suggestedEndDate(value, selectedLevel.duration_weeks));
                      }
                    }}
                  />
                </GroupField>
                <GroupField label="تاريخ النهاية">
                  <input
                    type="date"
                    value={form.endsOn}
                    onChange={(event) => update("endsOn", event.target.value)}
                  />
                </GroupField>
              </div>
              {selectedLevel ? (
                <div className="mt-4 grid gap-2 rounded-2xl border border-teal/15 bg-mist/55 p-3 sm:grid-cols-4">
                  <LevelDefault label="مدة المستوى" value={`${selectedLevel.duration_weeks} أسابيع`} />
                  <LevelDefault label="الحصص" value={`${selectedLevel.sessions_count} حصة`} />
                  <LevelDefault
                    label="مدة الحصة"
                    value={`${selectedLevel.session_duration_minutes} دقيقة`}
                  />
                  <LevelDefault
                    label="السعر المعتمد"
                    value={`${Number(selectedLevel.launch_price).toLocaleString("ar-EG")} ج.م`}
                  />
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-navy/[0.065] p-4">
              <h2 className="text-[12px] font-bold text-navy">المواعيد الأسبوعية</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ScheduleSlot
                  label="الموعد الأول"
                  day={form.firstDay}
                  time={form.firstTime}
                  onDayChange={(value) => update("firstDay", value)}
                  onTimeChange={(value) => update("firstTime", value)}
                />
                <ScheduleSlot
                  label="الموعد الثاني"
                  day={form.secondDay}
                  time={form.secondTime}
                  onDayChange={(value) => update("secondDay", value)}
                  onTimeChange={(value) => update("secondTime", value)}
                />
              </div>
            </section>

            {error ? (
              <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
                {error}
              </p>
            ) : null}

            <div className="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t border-navy/[0.06] bg-white/95 px-5 py-4 backdrop-blur sm:-mx-7 sm:px-7">
              <Dialog.Close asChild>
                <Button variant="secondary">إلغاء</Button>
              </Dialog.Close>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "جاري الإنشاء..." : "إنشاء الجروب"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ScheduleSlot({
  label,
  day,
  time,
  onDayChange,
  onTimeChange,
}: {
  label: string;
  day: string;
  time: string;
  onDayChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[12px] font-semibold text-slate">{label}</p>
      <div className="grid grid-cols-[1fr_110px] gap-2">
        <select
          className="min-h-11 rounded-xl border border-navy/[0.09] bg-cloud/70 px-3 text-[12px] outline-none"
          value={day}
          onChange={(event) => onDayChange(event.target.value)}
        >
          {days.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          className="min-h-11 rounded-xl border border-navy/[0.09] bg-cloud/70 px-3 text-[12px] outline-none"
          type="time"
          value={time}
          onChange={(event) => onTimeChange(event.target.value)}
        />
      </div>
    </div>
  );
}

function GroupField({ label, children }: { label: string; children: ReactElement }) {
  return (
    <label>
      <span className="mb-2 block text-[12px] font-semibold text-slate">{label}</span>
      <span className="[&>input]:min-h-11 [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-navy/[0.09] [&>input]:bg-cloud/70 [&>input]:px-3.5 [&>input]:text-[12px] [&>input]:outline-none [&>select]:min-h-11 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-navy/[0.09] [&>select]:bg-cloud/70 [&>select]:px-3.5 [&>select]:text-[12px] [&>select]:outline-none [&>select]:disabled:opacity-50">
        {children}
      </span>
    </label>
  );
}

function LevelDefault({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <p className="text-[12px] text-slate">{label}</p>
      <p className="mt-1 text-[13px] font-bold text-navy">{value}</p>
    </div>
  );
}

function suggestedEndDate(startsOn: string, weeks: number) {
  const date = new Date(`${startsOn}T12:00:00`);
  date.setDate(date.getDate() + weeks * 7 - 1);

  return date.toISOString().slice(0, 10);
}
