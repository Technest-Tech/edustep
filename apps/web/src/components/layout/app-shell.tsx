"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { NotificationCenter } from "@/components/layout/notification-center";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BookOpenCheck,
  BookOpenText,
  BadgeDollarSign,
  ChartNoAxesCombined,
  CalendarRange,
  CalendarDays,
  ChevronLeft,
  CircleDollarSign,
  ClipboardList,
  GraduationCap,
  HandCoins,
  House,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircleMore,
  MessagesSquare,
  LifeBuoy,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Tickets,
  UsersRound,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
};

const staffNavigation: NavigationItem[] = [
  { label: "نظرة عامة", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "العملاء والمتابعات",
    href: "/leads",
    icon: MessageCircleMore,
    roles: ["owner", "staff", "admissions", "academic_manager"],
  },
  {
    label: "القبول والتجارب",
    href: "/admissions",
    icon: Tickets,
    roles: ["owner", "staff", "admissions", "academic_manager"],
  },
  {
    label: "الجروبات والحصص",
    href: "/groups",
    icon: CalendarDays,
    roles: ["owner", "academic_manager"],
  },
  {
    label: "تقويم الأكاديمية",
    href: "/calendar",
    icon: CalendarRange,
    roles: ["owner", "academic_manager"],
  },
  { label: "الطلاب", href: "/students", icon: GraduationCap },
  {
    label: "المعلمون",
    href: "/teachers",
    icon: UsersRound,
    roles: ["owner", "academic_manager"],
  },
  {
    label: "المستويات والمناهج",
    href: "/levels",
    icon: BookOpenCheck,
    roles: ["owner", "academic_manager"],
  },
  {
    label: "مركز التواصل",
    href: "/communications",
    icon: MessagesSquare,
    roles: ["owner", "staff", "admissions", "academic_manager"],
  },
  {
    label: "التقدم والتقارير",
    href: "/progress",
    icon: ChartNoAxesCombined,
    roles: ["owner", "academic_manager"],
  },
  {
    label: "طلبات أولياء الأمور",
    href: "/service-requests",
    icon: LifeBuoy,
    roles: ["owner", "staff", "admissions", "academic_manager"],
  },
  {
    label: "الاشتراكات والتجديد",
    href: "/subscriptions",
    icon: BadgeDollarSign,
    roles: ["owner", "staff", "admissions", "academic_manager", "accountant"],
  },
  {
    label: "الحسابات والتحصيل",
    href: "/finance",
    icon: CircleDollarSign,
    roles: ["owner", "accountant"],
  },
  {
    label: "المصروفات والرواتب",
    href: "/payroll",
    icon: HandCoins,
    roles: ["owner", "accountant"],
  },
  {
    label: "التقارير ومؤشرات الأداء",
    href: "/reports",
    icon: BarChart3,
    roles: ["owner", "academic_manager", "accountant"],
  },
  {
    label: "إدارة الأكاديمية",
    href: "/management",
    icon: Settings2,
    roles: ["owner"],
  },
  { label: "دليل التشغيل", href: "/docs", icon: BookOpenText },
  { label: "أمان الحساب", href: "/security", icon: ShieldCheck },
];

const teacherNavigation: NavigationItem[] = [
  { label: "يومي وحصصي", href: "/teacher/today", icon: ClipboardList },
  { label: "جروباتي وطلابي", href: "/groups", icon: UsersRound },
  { label: "التقدم والتقارير", href: "/progress", icon: ChartNoAxesCombined },
  { label: "جدولي الأسبوعي", href: "/calendar", icon: CalendarRange },
  { label: "مستحقاتي", href: "/teacher/earnings", icon: WalletCards },
  { label: "دليل التشغيل", href: "/docs", icon: BookOpenText },
  { label: "أمان الحساب", href: "/security", icon: ShieldCheck },
];

const familyNavigation: NavigationItem[] = [
  { label: "متابعة الأبناء", href: "/family/home", icon: House },
  { label: "أمان الحساب", href: "/security", icon: ShieldCheck },
];

function navigationForRole(role?: string) {
  if (role === "teacher") return teacherNavigation;
  if (role === "guardian") return familyNavigation;

  return staffNavigation;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "نظرة عامة",
  "/leads": "العملاء والمتابعات",
  "/admissions": "القبول والتجارب",
  "/students": "الطلاب",
  "/groups": "الجروبات والحصص",
  "/calendar": "تقويم الأكاديمية",
  "/teachers": "المعلمون",
  "/levels": "المستويات والمناهج",
  "/finance": "الحسابات والتحصيل",
  "/payroll": "المصروفات ومستحقات المعلمين",
  "/reports": "التقارير ومؤشرات الأداء",
  "/management": "إدارة الأكاديمية",
  "/security": "أمان الحساب",
  "/communications": "مركز التواصل",
  "/subscriptions": "الاشتراكات والتجديد",
  "/progress": "التقدم والتقارير",
  "/service-requests": "طلبات أولياء الأمور",
  "/teacher/today": "يومي وحصصي",
  "/teacher/earnings": "مستحقاتي",
  "/docs": "دليل التشغيل",
  "/family/home": "متابعة الأبناء",
};

const roleLabels: Record<string, string> = {
  owner: "مدير الأكاديمية",
  staff: "فريق الإدارة",
  admissions: "مسؤول القبول",
  academic_manager: "المدير الأكاديمي",
  accountant: "مسؤول الحسابات",
  teacher: "معلم",
  guardian: "ولي أمر",
};

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    onNavigate?.();
    router.replace("/login");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-6">
        <Image
          src="/brand/edustep-logo-reversed.svg"
          alt="EduStep English Academy"
          width={190}
          height={55}
          priority
          className="h-auto w-[190px]"
        />
      </div>

      <div className="thin-scrollbar mt-9 flex-1 overflow-y-auto px-3">
        <p className="mb-2 px-3 text-[10px] font-semibold tracking-wide text-white/40">
          مساحة العمل
        </p>
        <nav className="space-y-1" aria-label="مساحة العمل">
          {navigationForRole(user?.role)
            .filter((item) => !item.roles || item.roles.includes(user?.role ?? ""))
            .map((item) => {
            const active =
              item.href !== "#" &&
              (pathname === item.href || pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-[12px] font-medium transition",
                  active
                    ? "bg-white text-navy shadow-[0_10px_28px_rgba(0,0,0,.13)]"
                    : "text-white/65 hover:bg-white/8 hover:text-white",
                )}
              >
                <Icon
                  size={18}
                  strokeWidth={1.9}
                  className={active ? "text-teal" : "text-white/45"}
                />
                <span className="flex-1">{item.label}</span>
                {item.href === "/leads" ? (
                  <span className="grid size-6 place-items-center rounded-full bg-sun text-[9px] font-bold text-navy">
                    CRM
                  </span>
                ) : active ? (
                  <ChevronLeft size={14} className="text-teal" />
                ) : null}
              </Link>
            );
            })}
        </nav>

      </div>

      <div className="m-3 rounded-2xl border border-white/10 bg-white/[0.065] p-3">
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal text-sm font-bold text-navy">
            {user?.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-white">
              {user?.name}
            </p>
            <p className="mt-1 truncate text-[9px] text-white/45">
              {roleLabels[user?.role ?? ""] ?? user?.role}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="grid size-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/8 hover:text-white"
            aria-label="تسجيل الخروج"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-navy/45 backdrop-blur-[2px]"
        aria-label="إغلاق القائمة"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 right-0 w-[min(86vw,330px)] bg-navy shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute left-4 top-5 z-10 grid size-9 place-items-center rounded-xl border border-white/10 bg-white/8 text-white/70"
          aria-label="إغلاق القائمة"
        >
          <X size={18} />
        </button>
        <SidebarContent onNavigate={onClose} />
      </aside>
    </div>,
    document.body,
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isTeacher = user?.role === "teacher";
  const isGuardian = user?.role === "guardian";
  const title =
    Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))?.[1] ??
    "EduStep";

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const value = search.trim();
    router.push(value ? `/leads?search=${encodeURIComponent(value)}` : "/leads");
  }

  return (
    <div className="flex min-h-screen bg-cloud">
      <aside className="sticky top-0 hidden h-screen w-[274px] shrink-0 bg-navy lg:block">
        <SidebarContent />
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-[72px] items-center gap-3 border-b border-navy/[0.06] bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button
            type="button"
            className="grid size-10 place-items-center rounded-xl bg-navy text-white shadow-[0_8px_22px_rgba(11,36,84,.15)] lg:hidden"
            aria-label="فتح القائمة"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={19} />
          </button>

          <div className="min-w-0 lg:hidden">
            <p className="truncate text-sm font-bold text-navy">EduStep</p>
            <p className="truncate text-[9px] text-slate">{title}</p>
          </div>

          <form
            onSubmit={submitSearch}
            className={`h-10 w-full max-w-[430px] items-center gap-2.5 rounded-xl border border-navy/[0.08] bg-cloud px-3.5 text-slate ${
              isTeacher || isGuardian ? "hidden" : "hidden md:flex"
            }`}
          >
            <Search aria-hidden="true" size={17} />
            <label htmlFor="global-search" className="sr-only">
              البحث في النظام
            </label>
            <input
              id="global-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-slate/60"
              placeholder="ابحث باسم عميل، رقم هاتف، أو طالب..."
            />
            <kbd className="rounded-md border border-navy/10 bg-white px-1.5 py-0.5 text-[8px] text-slate">
              Enter
            </kbd>
          </form>

          <div className="mr-auto flex items-center gap-2">
            {!isGuardian ? <NotificationCenter /> : null}
            {!isGuardian ? (
              <Button
                onClick={() => router.push(isTeacher ? "/teacher/today" : "/leads")}
                className="hidden sm:inline-flex"
              >
                <Sparkles size={15} className="text-sun" />
                {isTeacher ? "حصص اليوم" : "إجراء سريع"}
              </Button>
            ) : null}
          </div>
        </header>

        <main className="dashboard-grid min-h-[calc(100vh-72px)]">
          <div className="mx-auto max-w-[1530px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </div>
  );
}
