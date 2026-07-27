import { CommunicationsContent } from "@/features/communications/communications-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "مركز التواصل",
};

export default function CommunicationsPage() {
  return <CommunicationsContent />;
}
