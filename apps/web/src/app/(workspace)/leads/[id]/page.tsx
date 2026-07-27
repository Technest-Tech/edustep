import { LeadDetail } from "@/features/leads/lead-detail";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ملف العميل",
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <LeadDetail leadId={id} />;
}
