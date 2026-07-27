import { GroupsContent } from "@/features/groups/groups-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الجروبات والحصص",
};

export default function GroupsPage() {
  return <GroupsContent />;
}
