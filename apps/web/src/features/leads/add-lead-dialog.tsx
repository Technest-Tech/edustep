"use client";

import { Button } from "@/components/ui/button";
import { apiClient, ApiError } from "@/lib/api/client";
import type { ApiCollection, ApiItem, Lead, Program } from "@/types/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import type { ReactElement } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().min(2, "اكتب اسم العميل."),
  phone: z.string().min(8, "اكتب رقم هاتف صحيحًا."),
  source: z.enum([
    "whatsapp",
    "facebook",
    "instagram",
    "referral",
    "website",
    "walk_in",
    "other",
  ]),
  interested_program_id: z.string().optional(),
  learner_age: z.string().optional(),
  preferred_schedule: z.string().optional(),
  notes: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function AddLeadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const programs = useQuery({
    queryKey: ["programs"],
    queryFn: () => apiClient<ApiCollection<Program>>("/api/v1/programs"),
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      source: "whatsapp",
      interested_program_id: "",
      learner_age: "",
      preferred_schedule: "",
      notes: "",
    },
  });
  const mutation = useMutation({
    mutationFn: (values: Values) =>
      apiClient<ApiItem<Lead>>("/api/v1/leads", {
        method: "POST",
        json: {
          ...values,
          interested_program_id: values.interested_program_id || null,
          learner_age: values.learner_age ? Number(values.learner_age) : null,
          preferred_schedule: values.preferred_schedule || null,
          notes: values.notes || null,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      reset();
      onOpenChange(false);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          if (field in schema.shape) {
            setError(field as keyof Values, { message: messages[0] });
          }
        });
      }
    },
  });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/45 backdrop-blur-[2px] data-[state=open]:animate-in" />
        <Dialog.Content
          dir="rtl"
          className="fixed inset-y-0 left-0 z-50 w-full max-w-[560px] overflow-y-auto bg-cloud p-5 shadow-2xl outline-none sm:p-7"
        >
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="text-xl font-bold text-navy">
                إضافة عميل محتمل
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-[12px] leading-5 text-slate">
                سجل بيانات التواصل والاهتمام، ثم أضف أول متابعة من صفحة العميل.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="secondary" size="icon" aria-label="إغلاق">
                <X size={17} />
              </Button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="mt-8">
            <div className="rounded-2xl border border-navy/[0.065] bg-white p-5">
              <h3 className="text-xs font-bold text-navy">بيانات أساسية</h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="اسم العميل" error={errors.full_name?.message} className="sm:col-span-2">
                  <input placeholder="مثال: والد يوسف محمد" {...register("full_name")} />
                </Field>
                <Field label="رقم الهاتف" error={errors.phone?.message}>
                  <input dir="ltr" placeholder="01000000000" {...register("phone")} />
                </Field>
                <Field label="مصدر العميل" error={errors.source?.message}>
                  <select {...register("source")}>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="referral">ترشيح</option>
                    <option value="website">الموقع</option>
                    <option value="walk_in">زيارة الفرع</option>
                    <option value="other">أخرى</option>
                  </select>
                </Field>
                <Field label="البرنامج المهتم به" error={errors.interested_program_id?.message}>
                  <select {...register("interested_program_id")}>
                    <option value="">غير محدد بعد</option>
                    {programs.data?.data.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name_ar}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="عمر المتعلم" error={errors.learner_age?.message}>
                  <input type="number" min="4" max="100" placeholder="مثال: 10" {...register("learner_age")} />
                </Field>
                <Field label="الوقت المفضل" error={errors.preferred_schedule?.message} className="sm:col-span-2">
                  <input placeholder="مسائي، بعد المدرسة، عطلة نهاية الأسبوع..." {...register("preferred_schedule")} />
                </Field>
                <Field label="ملاحظات أولية" error={errors.notes?.message} className="sm:col-span-2">
                  <textarea rows={4} placeholder="ما الذي يبحث عنه العميل؟" {...register("notes")} />
                </Field>
              </div>
            </div>

            {mutation.isError && !(mutation.error instanceof ApiError) ? (
              <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-[12px] text-rose-700">
                تعذر حفظ العميل. حاول مرة أخرى.
              </p>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="secondary">إلغاء</Button>
              </Dialog.Close>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "جاري الحفظ..." : "حفظ العميل"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: ReactElement;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-[12px] font-semibold text-navy">{label}</span>
      <span className="[&>input]:min-h-11 [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-navy/[0.09] [&>input]:bg-cloud/70 [&>input]:px-3.5 [&>input]:text-[13px] [&>input]:outline-none [&>input]:transition [&>input]:focus:border-teal/50 [&>select]:min-h-11 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-navy/[0.09] [&>select]:bg-cloud/70 [&>select]:px-3.5 [&>select]:text-[13px] [&>select]:outline-none [&>textarea]:w-full [&>textarea]:resize-none [&>textarea]:rounded-xl [&>textarea]:border [&>textarea]:border-navy/[0.09] [&>textarea]:bg-cloud/70 [&>textarea]:p-3.5 [&>textarea]:text-[13px] [&>textarea]:outline-none">
        {children}
      </span>
      {error ? <span className="mt-1 block text-[12px] text-rose-600">{error}</span> : null}
    </label>
  );
}
