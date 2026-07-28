import { AuthGuard } from "@/components/auth/auth-guard";
import { DocsShell } from "@/features/docs/docs-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "دليل تشغيل الأكاديمية",
  description:
    "الدليل العملي الكامل لفريق EduStep لتشغيل العملاء والقبول والجروبات والطلاب والحسابات والتقارير.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DocumentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DocsShell>{children}</DocsShell>
    </AuthGuard>
  );
}
