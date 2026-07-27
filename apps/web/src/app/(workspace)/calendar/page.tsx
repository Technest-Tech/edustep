import { CalendarContent } from "@/features/calendar/calendar-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تقويم الأكاديمية",
};

export default function CalendarPage() {
  return <CalendarContent />;
}
