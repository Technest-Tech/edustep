import { TeacherToday } from "@/features/teacher/teacher-today";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "يومي وحصصي",
};

export default function TeacherTodayPage() {
  return <TeacherToday />;
}
