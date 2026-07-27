import { LeadsContent } from "@/features/leads/leads-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "العملاء والمتابعات",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; overdue?: string }>;
}) {
  const params = await searchParams;

  return (
    <LeadsContent
      initialSearch={params.search ?? ""}
      initialOverdue={params.overdue === "1"}
    />
  );
}
