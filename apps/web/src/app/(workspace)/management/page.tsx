import { ManagementCenter } from "@/features/management/management-center";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "إدارة الأكاديمية",
};

export default function ManagementPage() {
  return <ManagementCenter />;
}
