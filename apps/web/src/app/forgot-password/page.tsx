import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { RecoveryShell } from "@/components/auth/recovery-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "استعادة كلمة المرور",
};

export default function ForgotPasswordPage() {
  return (
    <RecoveryShell
      eyebrow="ACCOUNT RECOVERY"
      title="استعادة كلمة المرور"
      description="أدخل بريد الحساب. سنرسل رابطًا مؤقتًا إذا كان البريد مسجلًا، دون كشف بيانات أي حساب."
    >
      <ForgotPasswordForm />
    </RecoveryShell>
  );
}
