import { DashboardContent } from "@/features/dashboard/dashboard-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "نظرة عامة",
};

export default function DashboardPage() {
  return <DashboardContent />;
}
