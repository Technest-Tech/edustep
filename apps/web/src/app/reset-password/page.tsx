import { RecoveryShell } from "@/components/auth/recovery-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "كلمة مرور جديدة",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const parameters = await searchParams;

  return (
    <RecoveryShell
      eyebrow="SECURE RESET"
      title="أنشئ كلمة مرور جديدة"
      description="سيتم إغلاق الجلسات القديمة ورموز الوصول بعد إتمام التغيير بنجاح."
    >
      <ResetPasswordForm
        token={parameters.token ?? ""}
        initialEmail={parameters.email ?? ""}
      />
    </RecoveryShell>
  );
}
