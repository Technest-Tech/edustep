import { ReportsContent } from "@/features/reports/reports-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "التقارير ومؤشرات الأداء",
};

export default function ReportsPage() {
  return <ReportsContent />;
}
