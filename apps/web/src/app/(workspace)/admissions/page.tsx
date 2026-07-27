import { AdmissionsContent } from "@/features/admissions/admissions-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "القبول والتجارب",
};

export default function AdmissionsPage() {
  return <AdmissionsContent />;
}
