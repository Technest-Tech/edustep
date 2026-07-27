import { SubscriptionsContent } from "@/features/subscriptions/subscriptions-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الاشتراكات والتجديد",
};

export default function SubscriptionsPage() {
  return <SubscriptionsContent />;
}
