import { TeachersContent } from "@/features/teachers/teachers-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "المعلمون",
};

export default function TeachersPage() {
  return <TeachersContent />;
}
