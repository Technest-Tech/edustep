import { LevelsContent } from "@/features/levels/levels-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "المستويات والمناهج",
};

export default function LevelsPage() {
  return <LevelsContent />;
}
