import { PayrollContent } from "@/features/payroll/payroll-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "المصروفات ومستحقات المعلمين",
};

export default function PayrollPage() {
  return <PayrollContent />;
}
