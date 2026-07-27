import { StudentsContent } from "@/features/students/students-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الطلاب",
};

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;

  return <StudentsContent initialSearch={params.search ?? ""} />;
}
