import { FinanceContent } from "@/features/finance/finance-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الحسابات والتحصيل",
};

export default function FinancePage() {
  return <FinanceContent />;
}
