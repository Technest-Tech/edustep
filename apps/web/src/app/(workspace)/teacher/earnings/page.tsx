import { TeacherEarnings } from "@/features/teacher/teacher-earnings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "مستحقاتي",
};

export default function TeacherEarningsPage() {
  return <TeacherEarnings />;
}
