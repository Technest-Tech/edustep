import { GroupDetail } from "@/features/groups/group-detail";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "لوحة الجروب",
};

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <GroupDetail cohortId={id} />;
}
