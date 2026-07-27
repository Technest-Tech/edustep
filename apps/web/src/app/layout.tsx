import type { Metadata } from "next";
import { Alexandria, Almarai } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const alexandria = Alexandria({
  variable: "--font-alexandria",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const almarai = Almarai({
  variable: "--font-almarai",
  subsets: ["arabic"],
  weight: ["300", "400", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "EduStep Academy OS",
    template: "%s | EduStep",
  },
  description: "لوحة إدارة أكاديمية EduStep للعملاء والجروبات والطلاب والحسابات.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${alexandria.variable} ${almarai.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
