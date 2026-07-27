import { FamilyHome } from "@/features/family/family-home";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "متابعة الأبناء",
};

export default function FamilyHomePage() {
  return <FamilyHome />;
}
