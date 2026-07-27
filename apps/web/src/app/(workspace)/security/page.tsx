import { AccountSecurityCenter } from "@/features/security/account-security-center";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "أمان الحساب",
};

export default function SecurityPage() {
  return <AccountSecurityCenter />;
}
